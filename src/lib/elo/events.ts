/**
 * ELO event tracking system
 * Logs rating changes, tier changes, and other ELO-related events
 */

import { prisma } from '@/utils/prisma';

export interface EloEventData {
  userId: string;
  classId?: string;
  eventType: 'rating_change' | 'tier_change' | 'recompute' | 'metric_improvement';
  oldValue: number;
  newValue: number;
  change: number;
  metadata?: Record<string, unknown>;
}

export interface EloEvent {
  id: string;
  userId: string;
  classId?: string;
  eventType: string;
  oldValue: number;
  newValue: number;
  change: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Create an ELO event record
 * @param eventData - Event data to record
 * @returns Created EloEvent
 */
export async function createEloEvent(eventData: EloEventData): Promise<EloEvent> {
  try {
    const event = await prisma.eloEvent.create({
      data: {
        userId: eventData.userId,
        classId: eventData.classId,
        eventType: eventData.eventType,
        oldValue: eventData.oldValue,
        newValue: eventData.newValue,
        change: eventData.change,
        metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null,
        createdAt: new Date(),
      },
    });

    console.log(`[INFO] ELO event created: ${event.eventType} for user ${event.userId}, change: ${event.change}`);
    return event;
  } catch (error) {
    console.error(`[ERROR] Failed to create ELO event:`, error);
    throw error;
  }
}

/**
 * Get ELO events for a user
 * @param userId - User ID
 * @param limit - Maximum number of events to return
 * @param offset - Number of events to skip
 * @returns Array of EloEvent objects
 */
export async function getUserEloEvents(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<EloEvent[]> {
  try {
    const events = await prisma.eloEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return events.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : undefined,
    }));
  } catch (error) {
    console.error(`[ERROR] Failed to get ELO events for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get ELO events for a specific class
 * @param classId - Class ID
 * @param limit - Maximum number of events to return
 * @param offset - Number of events to skip
 * @returns Array of EloEvent objects
 */
export async function getClassEloEvents(
  classId: string,
  limit: number = 50,
  offset: number = 0
): Promise<EloEvent[]> {
  try {
    const events = await prisma.eloEvent.findMany({
      where: { classId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return events.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : undefined,
    }));
  } catch (error) {
    console.error(`[ERROR] Failed to get ELO events for class ${classId}:`, error);
    throw error;
  }
}

/**
 * Get recent ELO events across all users
 * @param limit - Maximum number of events to return
 * @param eventType - Filter by event type (optional)
 * @returns Array of EloEvent objects
 */
export async function getRecentEloEvents(
  limit: number = 100,
  eventType?: string
): Promise<EloEvent[]> {
  try {
    const where = eventType ? { eventType } : {};
    
    const events = await prisma.eloEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
        class: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return events.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : undefined,
    }));
  } catch (error) {
    console.error(`[ERROR] Failed to get recent ELO events:`, error);
    throw error;
  }
}

/**
 * Get ELO change statistics for a user
 * @param userId - User ID
 * @param days - Number of days to look back
 * @returns Statistics object
 */
export async function getUserEloStats(
  userId: string,
  days: number = 30
): Promise<{
  totalChange: number;
  averageChange: number;
  bestGain: number;
  worstLoss: number;
  eventCount: number;
  tierChanges: number;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const events = await prisma.eloEvent.findMany({
      where: {
        userId,
        createdAt: { gte: cutoffDate },
      },
      select: {
        change: number,
        eventType: string,
      },
    });

    if (events.length === 0) {
      return {
        totalChange: 0,
        averageChange: 0,
        bestGain: 0,
        worstLoss: 0,
        eventCount: 0,
        tierChanges: 0,
      };
    }

    const changes = events.map(e => e.change);
    const totalChange = changes.reduce((sum, change) => sum + change, 0);
    const averageChange = totalChange / events.length;
    const bestGain = Math.max(...changes);
    const worstLoss = Math.min(...changes);
    const tierChanges = events.filter(e => e.eventType === 'tier_change').length;

    return {
      totalChange,
      averageChange,
      bestGain,
      worstLoss,
      eventCount: events.length,
      tierChanges,
    };
  } catch (error) {
    console.error(`[ERROR] Failed to get ELO stats for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Clean up old ELO events (for maintenance)
 * @param daysOld - Delete events older than this many days
 * @returns Number of events deleted
 */
export async function cleanupOldEloEvents(daysOld: number = 365): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.eloEvent.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    console.log(`[INFO] Cleaned up ${result.count} old ELO events`);
    return result.count;
  } catch (error) {
    console.error(`[ERROR] Failed to cleanup old ELO events:`, error);
    throw error;
  }
}

/**
 * Get ELO leaderboard changes (who gained/lost the most)
 * @param days - Number of days to look back
 * @param limit - Maximum number of users to return
 * @returns Array of user ranking changes
 */
export async function getEloLeaderboardChanges(
  days: number = 7,
  limit: number = 20
): Promise<Array<{
  userId: string;
  displayName: string;
  totalChange: number;
  eventCount: number;
  bestGain: number;
}>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all ELO events in the time period
    const events = await prisma.eloEvent.findMany({
      where: {
        createdAt: { gte: cutoffDate },
      },
      select: {
        userId: true,
        change: number,
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    // Group by user and calculate totals
    const userChanges = new Map<string, { totalChange: number; eventCount: number; gains: number[] }>();
    
    for (const event of events) {
      const userId = event.userId;
      const existing = userChanges.get(userId) || { totalChange: 0, eventCount: 0, gains: [] };
      
      existing.totalChange += event.change;
      existing.eventCount += 1;
      if (event.change > 0) {
        existing.gains.push(event.change);
      }
      
      userChanges.set(userId, existing);
    }

    // Convert to array and sort by total change
    const leaderboard = Array.from(userChanges.entries()).map(([userId, data]) => ({
      userId,
      displayName: events.find(e => e.userId === userId)?.user.displayName || 'Unknown',
      totalChange: data.totalChange,
      eventCount: data.eventCount,
      bestGain: data.gains.length > 0 ? Math.max(...data.gains) : 0,
    }));

    return leaderboard
      .sort((a, b) => b.totalChange - a.totalChange)
      .slice(0, limit);
  } catch (error) {
    console.error(`[ERROR] Failed to get ELO leaderboard changes:`, error);
    throw error;
  }
}
