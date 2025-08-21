import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gymId } = req.body;

    if (!gymId) {
      return res.status(400).json({ error: 'Gym ID is required' });
    }

    // Verify the gym exists
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    // Update user's gym
    await prisma.user.update({
      where: { id: session.user.id },
      data: { gymId },
    });

    return res.status(200).json({
      success: true,
      message: 'Gym updated successfully',
      gym: {
        id: gym.id,
        name: gym.name,
        address: gym.address,
        city: gym.city,
        state: gym.state,
      },
    });

  } catch (error) {
    console.error('User gym update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
