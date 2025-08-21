import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { 
  recomputeUserClassElo, 
  recomputeClassElos, 
  recomputeOverallElo,
  batchRecomputeElos 
} from '@/lib/elo/recompute';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      userId, 
      classId, 
      type = 'user_class',
      options = {} 
    } = req.body;

    let results: unknown[] = [];

    switch (type) {
      case 'user_class':
        if (!userId || !classId) {
          return res.status(400).json({ error: 'userId and classId are required for user_class recompute' });
        }
        const result = await recomputeUserClassElo(userId, classId, options);
        results = [result];
        break;

      case 'class_all':
        if (!classId) {
          return res.status(400).json({ error: 'classId is required for class_all recompute' });
        }
        results = await recomputeClassElos(classId, options);
        break;

      case 'user_overall':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required for user_overall recompute' });
        }
        const overallResult = await recomputeOverallElo(userId, options);
        results = [overallResult];
        break;

      case 'batch':
        if (!Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ error: 'userIds array is required for batch recompute' });
        }
        results = await batchRecomputeElos(userIds, classId, options);
        break;

      default:
        return res.status(400).json({ error: 'Invalid type. Must be user_class, class_all, user_overall, or batch' });
    }

    return res.status(200).json({
      success: true,
      message: `ELO recompute completed for ${type}`,
      results,
      count: results.length,
    });

  } catch (error) {
    console.error('ELO recompute API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
