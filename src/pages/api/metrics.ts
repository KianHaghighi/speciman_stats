import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const metrics = await prisma.metric.findMany({
        include: {
          class: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { class: { name: 'asc' } },
          { name: 'asc' },
        ],
      });

      return res.status(200).json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
