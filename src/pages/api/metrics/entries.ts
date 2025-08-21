import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/utils/prisma';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sendReviewEmail } from '@/lib/email/review';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};

interface TierInfo {
  tier: string;
  requiresVideo: boolean;
}

const TIER_INFO: Record<string, TierInfo> = {
  unranked: { tier: 'unranked', requiresVideo: false },
  bronze: { tier: 'bronze', requiresVideo: false },
  silver: { tier: 'silver', requiresVideo: false },
  gold: { tier: 'gold', requiresVideo: false },
  platinum: { tier: 'platinum', requiresVideo: true },
  diamond: { tier: 'diamond', requiresVideo: true },
  legendary: { tier: 'legendary', requiresVideo: true },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse form data including files
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });

    const [fields, files] = await form.parse(req);
    
    const metricId = Array.isArray(fields.metricId) ? fields.metricId[0] : fields.metricId;
    const value = Array.isArray(fields.value) ? fields.value[0] : fields.value;
    const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes;
    const tier = Array.isArray(fields.tier) ? fields.tier[0] : fields.tier;
    const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;

    if (!metricId || !value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return res.status(400).json({ error: 'Invalid value' });
    }

    // Get metric information
    const metric = await prisma.metric.findUnique({
      where: { id: metricId },
      include: { class: true },
    });

    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }

    // Determine if video is required
    const tierInfo = TIER_INFO[tier?.toLowerCase() || 'unranked'] || TIER_INFO.unranked;
    const requiresVideo = tierInfo.requiresVideo;

    // Validate video requirement
    if (requiresVideo && !videoFile) {
      return res.status(400).json({ 
        error: 'Video is required for platinum and diamond tier performances' 
      });
    }

    let videoUrl: string | undefined;

    // Handle video upload if provided
    if (videoFile) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const fileExtension = path.extname(videoFile.originalFilename || '');
        const filename = `${uuidv4()}${fileExtension}`;
        const finalPath = path.join(uploadsDir, filename);

        // Move file to permanent location
        await fs.copyFile(videoFile.filepath, finalPath);
        await fs.unlink(videoFile.filepath); // Clean up temp file

        videoUrl = `/uploads/videos/${filename}`;
      } catch (uploadError) {
        console.error('Video upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload video' });
      }
    }

    // Determine entry status
    const status = requiresVideo && videoUrl ? 'PENDING' : 'APPROVED';

    // Create metric entry
    const entry = await prisma.userMetricEntry.create({
      data: {
        userId: session.user.id,
        metricId: metricId,
        value: numValue,
        notes: notes || undefined,
        status: status,
        videoUrl: videoUrl,
        createdAt: new Date(),
      },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
        metric: {
          select: {
            name: true,
            unit: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // If entry is pending, create review token and send email
    if (status === 'PENDING') {
      const reviewToken = await prisma.reviewToken.create({
        data: {
          token: uuidv4(),
          entryId: entry.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Send review email
      const emailResult = await sendReviewEmail({
        reviewerEmail: process.env.ADMIN_EMAIL || 'admin@specimenstats.com',
        entry: {
          id: entry.id,
          user: entry.user.displayName || 'Unknown User',
          metric: entry.metric.name,
          value: entry.value,
          unit: entry.metric.unit,
          class: entry.metric.class?.name || 'Unknown Class',
          tier: tier || 'unknown',
          videoUrl: videoUrl || '',
          notes: entry.notes || '',
        },
        token: reviewToken.token,
      });

      if (emailResult.ok) {
        console.log(`[INFO] Review email sent for entry ${entry.id}`);
      } else {
        console.warn(`[WARN] Review email failed for entry ${entry.id}: ${emailResult.error}`);
      }
    }

    // If approved, trigger ELO recomputation
    if (status === 'APPROVED') {
      try {
        // Import ELO recomputation (dynamic to avoid circular deps)
        const { recomputeUserClassElo, recomputeOverallElo } = await import('@/lib/elo/recompute');
        
        // Recompute class ELO
        await recomputeUserClassElo(session.user.id, metric.classId);
        
        // Recompute overall ELO
        await recomputeOverallElo(session.user.id);
        
        console.log(`[INFO] ELO recomputed for user ${session.user.id} after approved entry`);
      } catch (eloError) {
        console.error('[ERROR] Failed to recompute ELO:', eloError);
        // Don't fail the request if ELO recomputation fails
      }
    }

    return res.status(201).json({
      success: true,
      entry: {
        id: entry.id,
        value: entry.value,
        status: entry.status,
        tier: tier,
        requiresVideo: requiresVideo,
        hasVideo: !!videoUrl,
      },
      message: status === 'PENDING' 
        ? 'Entry submitted for review. You will be notified once it is processed.'
        : 'Entry approved and recorded successfully.',
    });

  } catch (error) {
    console.error('Metric entry error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
