import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  switch (req.method) {
    case 'POST':
      return handlePost(req, res, userId);
    case 'GET':
      return handleGet(req, res, userId);
    case 'PUT':
      return handlePut(req, res, userId);
    case 'DELETE':
      return handleDelete(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Send friend request
async function handlePost(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: userId }
        ]
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        fromUserId: userId,
        toUserId: targetUserId,
        status: 'PENDING'
      },
      include: {
        fromUser: {
          select: { id: true, name: true, displayName: true, image: true }
        },
        toUser: {
          select: { id: true, name: true, displayName: true, image: true }
        }
      }
    });

    // Create notification for target user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: `${friendRequest.fromUser.displayName || friendRequest.fromUser.name} sent you a friend request`,
        metadata: JSON.stringify({ requestId: friendRequest.id, fromUserId: userId })
      }
    });

    return res.status(201).json(friendRequest);
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
}

// Get friends list, requests, or compare stats
async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { action, targetUserId } = req.query;

    switch (action) {
      case 'requests':
        return await getFriendRequests(res, userId);
      case 'friends':
        return await getFriendsList(res, userId);
      case 'compare':
        if (!targetUserId) {
          return res.status(400).json({ error: 'Target user ID required for comparison' });
        }
        return await compareStats(res, userId, targetUserId as string);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error getting friends data:', error);
    return res.status(500).json({ error: 'Failed to get friends data' });
  }
}

// Respond to friend request
async function handlePut(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { requestId, action } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({ error: 'Request ID and action are required' });
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: { fromUser: true, toUser: true }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendRequest.toUserId !== userId) {
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    }

    if (action === 'accept') {
      // Create friendship
      await prisma.friendship.create({
        data: {
          user1Id: friendRequest.fromUserId,
          user2Id: friendRequest.toUserId,
          createdAt: new Date()
        }
      });

      // Update request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      // Create notification for sender
      await prisma.notification.create({
        data: {
          userId: friendRequest.fromUserId,
          type: 'FRIEND_ACCEPTED',
          title: 'Friend Request Accepted',
          message: `${friendRequest.toUser.displayName || friendRequest.toUser.name} accepted your friend request`,
          metadata: JSON.stringify({ acceptedUserId: userId })
        }
      });

      return res.json({ message: 'Friend request accepted' });
    } else if (action === 'reject') {
      // Update request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });

      return res.json({ message: 'Friend request rejected' });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return res.status(500).json({ error: 'Failed to respond to friend request' });
  }
}

// Remove friend or cancel request
async function handleDelete(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { targetUserId, requestId } = req.body;

    if (requestId) {
      // Cancel friend request
      const request = await prisma.friendRequest.findUnique({
        where: { id: requestId }
      });

      if (!request || request.fromUserId !== userId) {
        return res.status(403).json({ error: 'Not authorized to cancel this request' });
      }

      await prisma.friendRequest.delete({
        where: { id: requestId }
      });

      return res.json({ message: 'Friend request cancelled' });
    } else if (targetUserId) {
      // Remove friend
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: userId }
          ]
        }
      });

      if (!friendship) {
        return res.status(404).json({ error: 'Friendship not found' });
      }

      await prisma.friendship.delete({
        where: { id: friendship.id }
      });

      return res.json({ message: 'Friend removed' });
    } else {
      return res.status(400).json({ error: 'Target user ID or request ID required' });
    }
  } catch (error) {
    console.error('Error removing friend/request:', error);
    return res.status(500).json({ error: 'Failed to remove friend/request' });
  }
}

async function getFriendRequests(res: NextApiResponse, userId: string) {
  const requests = await prisma.friendRequest.findMany({
    where: {
      toUserId: userId,
      status: 'PENDING'
    },
    include: {
      fromUser: {
        select: { id: true, name: true, displayName: true, image: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json(requests);
}

async function getFriendsList(res: NextApiResponse, userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    },
    include: {
      user1: {
        select: { id: true, name: true, displayName: true, image: true, overallElo: true }
      },
      user2: {
        select: { id: true, name: true, displayName: true, image: true, overallElo: true }
      }
    }
  });

  const friends = friendships.map(friendship => {
    const friend = friendship.user1Id === userId ? friendship.user2 : friendship.user1;
    return {
      id: friend.id,
      name: friend.name,
      displayName: friend.displayName,
      image: friend.image,
      overallElo: friend.overallElo,
      friendshipId: friendship.id
    };
  });

  return res.json(friends);
}

async function compareStats(res: NextApiResponse, userId: string, targetUserId: string) {
  // Get both users' data
  const [user, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        image: true,
        overallElo: true,
        primaryClassId: true,
        entries: {
          include: {
            metric: {
              select: { id: true, name: true, slug: true, unit: true, higherIsBetter: true }
            }
          }
        }
      }
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        displayName: true,
        image: true,
        overallElo: true,
        primaryClassId: true,
        entries: {
          include: {
            metric: {
              select: { id: true, name: true, slug: true, unit: true, higherIsBetter: true }
            }
          }
        }
      }
    })
  ]);

  if (!user || !targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if they are friends
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: userId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: userId }
      ]
    }
  });

  if (!friendship) {
    return res.status(403).json({ error: 'Can only compare stats with friends' });
  }

  // Calculate metric comparisons
  const userMetrics = new Map();
  const targetMetrics = new Map();

  // Group entries by metric for both users
  user.entries.forEach(entry => {
    const metricId = entry.metric.id;
    if (!userMetrics.has(metricId)) {
      userMetrics.set(metricId, []);
    }
    userMetrics.get(metricId).push(entry.value);
  });

  targetUser.entries.forEach(entry => {
    const metricId = entry.metric.id;
    if (!targetMetrics.has(metricId)) {
      targetMetrics.set(metricId, []);
    }
    targetMetrics.get(metricId).push(entry.value);
  });

  // Compare metrics
  const comparisons = [];
  const allMetricIds = new Set([...userMetrics.keys(), ...targetMetrics.keys()]);

  for (const metricId of allMetricIds) {
    const userValues = userMetrics.get(metricId) || [];
    const targetValues = targetMetrics.get(metricId) || [];
    
    if (userValues.length > 0 || targetValues.length > 0) {
      const userBest = userValues.length > 0 ? Math.max(...userValues) : 0;
      const targetBest = targetValues.length > 0 ? Math.max(...targetValues) : 0;
      
      // Find metric details
      const userEntry = user.entries.find(e => e.metric.id === metricId);
      const targetEntry = targetUser.entries.find(e => e.metric.id === metricId);
      
      if (userEntry || targetEntry) {
        const metric = userEntry?.metric || targetEntry?.metric;
        
        comparisons.push({
          metricId: metric.id,
          metricName: metric.name,
          metricSlug: metric.slug,
          unit: metric.unit,
          higherIsBetter: metric.higherIsBetter,
          userValue: userBest,
          targetValue: targetBest,
          difference: userBest - targetBest,
          userHasValue: userValues.length > 0,
          targetHasValue: targetValues.length > 0
        });
      }
    }
  }

  const comparison = {
    user: {
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      image: user.image,
      overallElo: user.overallElo,
      primaryClassId: user.primaryClassId
    },
    targetUser: {
      id: targetUser.id,
      name: targetUser.name,
      displayName: targetUser.displayName,
      image: targetUser.image,
      overallElo: targetUser.overallElo,
      primaryClassId: targetUser.primaryClassId
    },
    comparisons,
    overallEloDifference: user.overallElo - targetUser.overallElo
  };

  return res.json(comparison);
}
