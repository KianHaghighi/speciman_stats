import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { limit = '20', offset = '0', unreadOnly = 'false' } = req.query;
      
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const unreadOnlyBool = unreadOnly === 'true';

      const where = {
        userId: session.user.id,
        ...(unreadOnlyBool && { readAt: null }),
      };

      const [notifications, totalCount, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limitNum,
          skip: offsetNum,
        }),
        prisma.notification.count({ where: { userId: session.user.id } }),
        prisma.notification.count({ 
          where: { userId: session.user.id, readAt: null } 
        }),
      ]);

      return res.status(200).json({
        notifications: notifications.map(notification => ({
          ...notification,
          data: notification.data ? JSON.parse(notification.data) : null,
        })),
        pagination: {
          total: totalCount,
          unread: unreadCount,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < totalCount,
        },
      });
    }

    if (req.method === 'PATCH') {
      const { action, notificationIds } = req.body;

      if (action === 'markAsRead') {
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return res.status(400).json({ error: 'notificationIds array is required' });
        }

        await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id,
            readAt: null, // Only update unread notifications
          },
          data: {
            readAt: new Date(),
          },
        });

        return res.status(200).json({ 
          success: true, 
          message: `Marked ${notificationIds.length} notifications as read` 
        });
      }

      if (action === 'markAllAsRead') {
        const result = await prisma.notification.updateMany({
          where: {
            userId: session.user.id,
            readAt: null,
          },
          data: {
            readAt: new Date(),
          },
        });

        return res.status(200).json({ 
          success: true, 
          message: `Marked ${result.count} notifications as read` 
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    if (req.method === 'DELETE') {
      const { notificationIds } = req.body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({ error: 'notificationIds array is required' });
      }

      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
      });

      return res.status(200).json({ 
        success: true, 
        message: `Deleted ${result.count} notifications` 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
