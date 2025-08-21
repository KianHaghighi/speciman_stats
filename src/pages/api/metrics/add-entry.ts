import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/utils/prisma';
import { recomputeElosForUser } from '@/lib/elo/recompute';
import { log } from '@/server/logger';
import { z } from 'zod';

const AddEntrySchema = z.object({
  metricId: z.string().cuid(),
  value: z.number().positive().finite(),
  notes: z.string().max(500).optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;

    // Validate input
    const parsed = AddEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { metricId, value, notes } = parsed.data;

    // Verify metric exists
    const metric = await prisma.metric.findUnique({
      where: { id: metricId },
      select: { id: true, name: true }
    });

    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }

    // Create the entry
    await prisma.userMetricEntry.create({
      data: {
        userId,
        metricId,
        value,
        notes
      }
    });

    // Recompute ELOs
    const eloResult = await recomputeElosForUser(userId);

    if (eloResult && 'classes' in eloResult) {
      // Check if any class ELO increased for animation triggers
      const hasImprovement = eloResult.classes.some((_, index) => {
        const existing = eloResult.classes[index];
        return existing && existing.elo > 1000; // Base ELO
      });

      log.info('Metric entry added successfully', {
        userId,
        metricId,
        value,
        hasImprovement
      });

      return res.status(200).json({
        success: true,
        message: 'Entry added successfully',
        eloUpdate: eloResult,
        hasImprovement
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Entry added successfully'
    });

  } catch (error) {
    log.error('Failed to add metric entry', { 
      error: (error as Error).message,
      body: req.body 
    });
    
    return res.status(500).json({ 
      error: 'Could not save entry. Please try again.' 
    });
  }
}
