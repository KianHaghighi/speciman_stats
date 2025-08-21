import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { logger } from '@/server/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      // Return logs
      const logs = logger.getLogs();
      return res.json(logs);

    case 'DELETE':
      // Clear logs
      logger.clearLogs();
      logger.info('dev-logs', 'Logs cleared by user', { userId: session.user.id });
      return res.json({ message: 'Logs cleared' });

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
