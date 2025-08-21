import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all gyms with member count and top ELO
    const gyms = await prisma.gym.findMany({
      include: {
        _count: {
          select: {
            users: true, // Count of users who have this gym as their primary
          },
        },
        users: {
          select: {
            overallElo: true,
          },
          orderBy: {
            overallElo: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to match our interface
    const transformedGyms = gyms.map(gym => ({
      id: gym.id,
      name: gym.name,
      address: gym.address,
      city: gym.city,
      state: gym.state,
      country: gym.country,
      latitude: gym.latitude,
      longitude: gym.longitude,
      memberCount: gym._count.users,
      topElo: gym.users[0]?.overallElo || 0,
    }));

    return res.status(200).json({
      success: true,
      gyms: transformedGyms,
    });

  } catch (error) {
    console.error('Gyms API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
