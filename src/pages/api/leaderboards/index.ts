import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';

interface LeaderboardQuery {
  by: 'overall' | 'class' | 'gym' | 'state' | 'city' | 'age';
  classId?: string;
  gymId?: string;
  state?: string;
  city?: string;
  age?: number;
  ageMin?: number;
  ageMax?: number;
  limit?: number;
  cursor?: string;
  searchName?: string;
  jumpToRank?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      by = 'overall',
      classId,
      gymId,
      state,
      city,
      age,
      ageMin,
      ageMax,
      limit = 50,
      cursor,
      searchName,
      jumpToRank,
    } = req.query as LeaderboardQuery;

    // Build where clause based on facets
    const where: any = {
      // Only include users with completed onboarding
      displayName: { not: null },
      dateOfBirth: { not: null },
      gender: { not: null },
    };

    // Add facet-specific filters
    if (by === 'class' && classId) {
      where.primaryClassId = classId;
    } else if (by === 'gym' && gymId) {
      where.gymId = gymId;
    } else if (by === 'state' && state) {
      where.gym = { state: { equals: state, mode: 'insensitive' } };
    } else if (by === 'city' && city) {
      where.gym = { city: { equals: city, mode: 'insensitive' } };
    } else if (by === 'age') {
      if (age) {
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - age);
        where.dateOfBirth = {
          gte: cutoffDate,
          lt: new Date(cutoffDate.getFullYear() + 1, 0, 1),
        };
      } else if (ageMin || ageMax) {
        const now = new Date();
        if (ageMin) {
          const maxDate = new Date(now.getFullYear() - ageMin, 0, 1);
          where.dateOfBirth = { ...where.dateOfBirth, lte: maxDate };
        }
        if (ageMax) {
          const minDate = new Date(now.getFullYear() - ageMax - 1, 11, 31);
          where.dateOfBirth = { ...where.dateOfBirth, gte: minDate };
        }
      }
    }

    // Add additional filters for other facets
    if (classId && by !== 'class') {
      where.primaryClassId = classId;
    }

    if (gymId && by !== 'gym') {
      where.gymId = gymId;
    }

    if (state && by !== 'state') {
      where.gym = { ...where.gym, state: { equals: state, mode: 'insensitive' } };
    }

    if (city && by !== 'city') {
      where.gym = { ...where.gym, city: { equals: city, mode: 'insensitive' } };
    }

    if (age && by !== 'age') {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - age);
      where.dateOfBirth = {
        gte: cutoffDate,
        lt: new Date(cutoffDate.getFullYear() + 1, 0, 1),
      };
    }

    if (ageMin && by !== 'age') {
      const now = new Date();
      const maxDate = new Date(now.getFullYear() - ageMin, 0, 1);
      where.dateOfBirth = { ...where.dateOfBirth, lte: maxDate };
    }

    if (ageMax && by !== 'age') {
      const now = new Date();
      const minDate = new Date(now.getFullYear() - ageMax - 1, 11, 31);
      where.dateOfBirth = { ...where.dateOfBirth, gte: minDate };
    }

    if (searchName) {
      where.displayName = { contains: searchName, mode: 'insensitive' };
    }

    // Calculate age and BMI for tiebreakers
    const usersWithStats = await prisma.user.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        dateOfBirth: true,
        gender: true,
        height: true,
        weight: true,
        overallElo: true,
        primaryClass: {
          select: { name: true },
        },
        gym: {
          select: { name: true, city: true, state: true },
        },
        _count: {
          select: {
            metricEntries: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
      orderBy: { overallElo: 'desc' },
    });

    // Calculate age and BMI for each user
    const usersWithCalculatedStats = usersWithStats.map(user => {
      const age = user.dateOfBirth ? calculateAge(user.dateOfBirth) : 0;
      const bmi = user.height && user.weight ? calculateBMI(user.height, user.weight) : 0;
      const bmiDeviation = Math.abs(bmi - 22); // Distance from ideal BMI
      
      return {
        ...user,
        age,
        bmi,
        bmiDeviation,
        totalMetrics: user._count.metricEntries,
      };
    });

    // Apply tiebreakers: (1) ELO, (2) total metrics, (3) age (younger wins), (4) BMI deviation, (5) name
    usersWithCalculatedStats.sort((a, b) => {
      // Primary: ELO (descending)
      if (a.overallElo !== b.overallElo) {
        return b.overallElo - a.overallElo;
      }
      
      // Secondary: Total completed metrics (higher wins)
      if (a.totalMetrics !== b.totalMetrics) {
        return b.totalMetrics - a.totalMetrics;
      }
      
      // Tertiary: Age (younger wins)
      if (a.age !== b.age) {
        return a.age - b.age;
      }
      
      // Quaternary: BMI deviation from 22 (closer wins)
      if (a.bmiDeviation !== b.bmiDeviation) {
        return a.bmiDeviation - b.bmiDeviation;
      }
      
      // Quinary: Display name (alphabetical)
      return (a.displayName || '').localeCompare(b.displayName || '');
    });

    // Handle jump to rank
    let startIndex = 0;
    if (jumpToRank && jumpToRank > 0) {
      startIndex = Math.max(0, jumpToRank - 1 - Math.floor(limit / 2));
    }

    // Apply pagination
    const paginatedUsers = usersWithCalculatedStats.slice(startIndex, startIndex + limit);

    // Transform to leaderboard entries
    const entries = paginatedUsers.map((user, index) => ({
      rank: startIndex + index + 1,
      userId: user.id,
      displayName: user.displayName || 'Unknown',
      overallElo: user.overallElo || 0,
      primaryClass: user.primaryClass?.name || 'Unknown',
      age: user.age,
      totalMetrics: user.totalMetrics,
      gym: user.gym?.name || 'No Gym',
      city: user.gym?.city || 'Unknown',
      state: user.gym?.state || 'Unknown',
      bmi: user.bmi,
    }));

    // Calculate pagination info
    const total = usersWithCalculatedStats.length;
    const hasMore = startIndex + limit < total;
    const nextCursor = hasMore ? (startIndex + limit).toString() : null;

    return res.status(200).json({
      success: true,
      entries,
      pagination: {
        total,
        limit,
        offset: startIndex,
        hasMore,
        nextCursor,
        currentPage: Math.floor(startIndex / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
      facets: {
        by,
        classId,
        gymId,
        state,
        city,
        age,
        ageMin,
        ageMax,
      },
      jumpInfo: jumpToRank ? {
        requestedRank: jumpToRank,
        actualRank: startIndex + 1,
        centered: true,
      } : null,
    });

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to calculate age
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to calculate BMI
function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}
