import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/utils/prisma';
import { recomputeUserClassElo, recomputeOverallElo } from '@/lib/elo/recompute';

interface OnboardingData {
  dateOfBirth: string;
  sexAtBirth: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
  primaryClassId: string;
  gymId?: string;
  newGymName?: string;
  newGymCity?: string;
  newGymState?: string;
  initialMetrics: {
    metricId: string;
    value: number;
    videoUrl?: string;
  }[];
  derivedMetrics: {
    slug: string;
    value: number;
  }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data: OnboardingData = req.body;

    // Validate required fields
    const requiredFields = ['dateOfBirth', 'sexAtBirth', 'heightCm', 'weightKg', 'bodyFatPct', 'primaryClassId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate age
    const birthDate = new Date(data.dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 13 || age > 100) {
      return res.status(400).json({ error: 'Age must be between 13 and 100' });
    }

    // Validate body metrics
    if (data.heightCm < 100 || data.heightCm > 250) {
      return res.status(400).json({ error: 'Height must be between 100-250 cm' });
    }
    if (data.weightKg < 30 || data.weightKg > 300) {
      return res.status(400).json({ error: 'Weight must be between 30-300 kg' });
    }
    if (data.bodyFatPct < 3 || data.bodyFatPct > 50) {
      return res.status(400).json({ error: 'Body fat % must be between 3-50%' });
    }

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      let gymId = data.gymId;

      // Create new gym if needed
      if (!gymId && data.newGymName) {
        const newGym = await tx.gym.create({
          data: {
            name: data.newGymName,
            city: data.newGymCity,
            state: data.newGymState,
            country: 'USA', // Default for now
          },
        });
        gymId = newGym.id;
      }

      // Update user profile
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          displayName: session.user.name || session.user.email?.split('@')[0],
          gender: data.sexAtBirth,
          dateOfBirth: birthDate,
          primaryClassId: data.primaryClassId,
          gymId: gymId,
          updatedAt: new Date(),
        },
      });

      // Create user class ELOs for all classes
      const allClasses = await tx.class.findMany();
      for (const cls of allClasses) {
        const isPrimary = cls.id === data.primaryClassId;
        const baseElo = isPrimary ? 1100 : 1000; // Slight boost for primary class

        await tx.userClassElo.upsert({
          where: {
            userId_classId: {
              userId: session.user.id,
              classId: cls.id,
            },
          },
          update: {},
          create: {
            userId: session.user.id,
            classId: cls.id,
            elo: baseElo,
          },
        });
      }

      // Find or create BMI and FFMI metrics
      const bmiMetric = await tx.metric.upsert({
        where: { slug: 'bmi' },
        update: {},
        create: {
          id: 'metric_bmi',
          name: 'Body Mass Index',
          slug: 'bmi',
          classId: data.primaryClassId,
          unit: 'kg/m²',
          higherIsBetter: false, // Lower BMI is generally better for athletes
          weight: 0.5, // Lower weight as it's a derived metric
          group: 'body-composition',
        },
      });

      const ffmiMetric = await tx.metric.upsert({
        where: { slug: 'ffmi' },
        update: {},
        create: {
          id: 'metric_ffmi',
          name: 'Fat-Free Mass Index',
          slug: 'ffmi',
          classId: data.primaryClassId,
          unit: 'kg/m²',
          higherIsBetter: true,
          weight: 0.8,
          group: 'body-composition',
        },
      });

      // Create derived metric entries (BMI & FFMI) with APPROVED status
      for (const derivedMetric of data.derivedMetrics) {
        const metric = derivedMetric.slug === 'bmi' ? bmiMetric : ffmiMetric;
        
        await tx.userMetricEntry.create({
          data: {
            userId: session.user.id,
            metricId: metric.id,
            value: derivedMetric.value,
            notes: 'Calculated during onboarding',
            status: 'APPROVED', // Auto-approve derived metrics
            createdAt: new Date(),
          },
        });
      }

      // Create initial metric entries
      for (const initialMetric of data.initialMetrics) {
        const needsReview = initialMetric.videoUrl ? false : true; // If video provided, auto-approve
        
        await tx.userMetricEntry.create({
          data: {
            userId: session.user.id,
            metricId: initialMetric.metricId,
            value: initialMetric.value,
            notes: 'Initial metric from onboarding',
            status: needsReview ? 'PENDING' : 'APPROVED',
            videoUrl: initialMetric.videoUrl,
            createdAt: new Date(),
          },
        });
      }

          return updatedUser;
  });

  // Now trigger ELO recalculation for the user's classes
  try {
    // Get all classes the user is in
    const userClassElos = await prisma.userClassElo.findMany({
      where: { userId: session.user.id },
      select: { classId: true },
    });

    // Recompute ELO for each class
    for (const userClassElo of userClassElos) {
      await recomputeUserClassElo(session.user.id, userClassElo.classId);
    }

    // Recompute overall ELO
    await recomputeOverallElo(session.user.id);

    console.log(`[INFO] ELO recomputed for user ${session.user.id} after onboarding`);
  } catch (eloError) {
    console.error(`[ERROR] Failed to recompute ELO after onboarding for user ${session.user.id}:`, eloError);
    // Don't fail onboarding if ELO recompute fails
  }

    return res.status(200).json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      user: result,
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
