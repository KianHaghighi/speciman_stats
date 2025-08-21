import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json(classes);
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return res.status(500).json({ error: 'Failed to fetch classes' });
  }
}
