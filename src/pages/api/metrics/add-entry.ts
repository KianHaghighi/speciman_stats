import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/utils/prisma';
import { recomputeUserClassElo, recomputeOverallElo } from '@/lib/elo/recompute';
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

    // Verify metric exists and get class info
    const metric = await prisma.metric.findUnique({
      where: { id: metricId },
      select: { id: true, name: true, classId: true }
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

    // Recompute ELOs for the affected class and overall
    try {
      const classEloResult = await recomputeUserClassElo(userId, metric.classId);
      const overallEloResult = await recomputeOverallElo(userId);

      const hasImprovement = classEloResult.change > 0;

      log.info('Metric entry added successfully', {
        userId,
        metricId,
        value,
        hasImprovement,
        classEloChange: classEloResult.change,
        overallEloChange: overallEloResult.change
      });

      return res.status(200).json({
        success: true,
        message: 'Entry added successfully',
        eloUpdate: {
          class: classEloResult,
          overall: overallEloResult
        },
        hasImprovement
      });
    } catch (eloError) {
      // Log ELO error but don't fail the request
      log.error('Failed to recompute ELO', { 
        error: (eloError as Error).message,
        userId,
        metricId
      });
      
      return res.status(200).json({
        success: true,
        message: 'Entry added successfully (ELO recomputation pending)'
      });
    }

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
