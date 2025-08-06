import { initTRPC, TRPCError } from '@trpc/server';
import { prisma } from '@/utils/prisma';
import { z } from 'zod';
import type { Context } from '../context';
import { 
  calculateUserClassElos, 
  totalElo, 
  tierFromElo, 
  getCachedElo, 
  setCachedElo,
  FITNESS_CLASSES 
} from '@/utils/elo';
import { logger } from '@/utils/logger';

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    logger.warn('TRPC Auth Error: No user in session', { ctx: { session: ctx.session } });
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You are not logged in. Please sign in again. If this error persists, try clearing your cookies and refreshing the page.',
    });
  }
  return next({ ctx });
});

const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });
  
  if (user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  
  return next({ ctx });
});

const protectedProcedure = t.procedure.use(isAuthed);
const adminProcedure = t.procedure.use(isAuthed).use(isAdmin);

export const userRouter = t.router({
  all: t.procedure.query(async () => {
    try {
      logger.dbEvent('select', 'user', { operation: 'findMany' });
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      logger.error('TRPC Error in user.all', error as Error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch users. Please try again later. Details: ' + (error instanceof Error ? error.message : String(error)),
      });
    }
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        logger.dbEvent('select', 'user', { operation: 'findUnique', userId: input.id });
        const user = await prisma.user.findUnique({
          where: { id: input.id },
          include: {
            entries: {
              include: {
                metric: true,
              },
            },
          },
        });
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        return user;
      } catch (error) {
        logger.error('TRPC Error in user.byId', error as Error, { input, ctx });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user. Please try again later. Details: ' + (error instanceof Error ? error.message : String(error)),
        });
      }
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No session found. Please sign in again.',
        });
      }
      logger.dbEvent('select', 'user', { operation: 'findUnique', userId: ctx.session.user.id });
      const user = await prisma.user.findUnique({
        where: { id: ctx.session!.user.id },
        include: {
          entries: {
            include: {
              metric: true,
            },
          },
        },
      });
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
      return user;
    } catch (error) {
      logger.error('TRPC Error in user.me', error as Error, { ctx });
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user. Please try again later. Details: ' + (error instanceof Error ? error.message : String(error)),
      });
    }
  }),

  // Updated specimen level calculation with new Elo system
  specimenLevel: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      // Check cache first
      const cached = getCachedElo(input.id);
      if (cached) {
        return cached;
      }

      logger.dbEvent('select', 'user', { operation: 'specimenLevel', userId: input.id });
      
      // Fetch all required data
      const [user, allEntries, metrics] = await Promise.all([
        prisma.user.findUnique({ where: { id: input.id } }),
        prisma.entry.findMany(),
        prisma.metric.findMany(),
      ]);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const userEntries = allEntries.filter(e => e.user_id === input.id);

      // Calculate class Elos
      const classElos = calculateUserClassElos(userEntries, allEntries, metrics);
      const totalEloRating = totalElo(classElos);
      const tier = tierFromElo(totalEloRating);

      // Calculate percentiles for each metric
      const percentiles = metrics.map(metric => {
        const metricEntries = allEntries.filter(e => e.metric_id === metric.id);
        const userMetricEntries = userEntries.filter(e => e.metric_id === metric.id);
        
        if (!userMetricEntries.length || !metricEntries.length) return null;
        
        const userBest = Math.max(...userMetricEntries.map(e => e.value));
        const sorted = metricEntries.map(e => e.value).sort((a, b) => a - b);
        const index = sorted.findIndex(v => v >= userBest);
        const percentile = sorted.length > 1 ? (index / (sorted.length - 1)) : 1;
        
        return {
          metricId: metric.id,
          metricName: metric.name,
          percentile: percentile * 100, // Convert to percentage
        };
      }).filter(Boolean);

      const result = {
        elo: totalEloRating,
        tier,
        classElos,
        percentiles,
        rank: 1, // TODO: Implement ranking system
      };

      // Cache the result
      setCachedElo(input.id, result);
      
      return result;
    } catch (error) {
      logger.error('TRPC Error in user.specimenLevel', error as Error, { input });
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to calculate specimen level',
      });
    }
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      class: z.string().optional(),
      sex: z.string().optional(),
      age: z.number().optional(),
      heightCm: z.number().optional(),
      weightKg: z.number().optional(),
      bmi: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const updatedUser = await prisma.user.update({
          where: { id: ctx.session!.user.id },
          data: input,
        });
        
        logger.dbEvent('update', 'user', { operation: 'updateProfile', userId: ctx.session!.user.id });
        
        return updatedUser;
      } catch (error) {
        logger.error('TRPC Error in user.updateProfile', error as Error, { input, ctx });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),

  // Video verification endpoints
  submitVideo: protectedProcedure
    .input(z.object({
      metricId: z.number(),
      url: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const video = await prisma.video.create({
          data: {
            userId: ctx.session!.user.id,
            metricId: input.metricId,
            url: input.url,
          },
        });

        logger.dbEvent('create', 'video', { operation: 'submitVideo', userId: ctx.session!.user.id });
        
        return video;
      } catch (error) {
        logger.error('TRPC Error in user.submitVideo', error as Error, { input, ctx });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit video',
        });
      }
    }),

  // Admin endpoints
  getPendingVideos: adminProcedure.query(async () => {
    try {
      return await prisma.video.findMany({
        where: { status: 'pending' },
        include: {
          user: { select: { name: true, email: true } },
          metric: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('TRPC Error in user.getPendingVideos', error as Error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch pending videos',
      });
    }
  }),

  approveVideo: adminProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const video = await prisma.video.update({
          where: { id: input.videoId },
          data: { status: 'approved' },
          include: { user: true, metric: true },
        });

        // TODO: Send approval email
        // TODO: Recalculate user Elo if needed

        logger.dbEvent('update', 'video', { operation: 'approveVideo', videoId: input.videoId });
        
        return video;
      } catch (error) {
        logger.error('TRPC Error in user.approveVideo', error as Error, { input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve video',
        });
      }
    }),

  rejectVideo: adminProcedure
    .input(z.object({ videoId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const video = await prisma.video.update({
          where: { id: input.videoId },
          data: { status: 'rejected' },
          include: { user: true, metric: true },
        });

        // TODO: Send rejection email with reason

        logger.dbEvent('update', 'video', { operation: 'rejectVideo', videoId: input.videoId });
        
        return video;
      } catch (error) {
        logger.error('TRPC Error in user.rejectVideo', error as Error, { input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reject video',
        });
      }
    }),

  // Recalculate all user Elos (admin only)
  recalculateAllElos: adminProcedure.mutation(async () => {
    try {
      const users = await prisma.user.findMany();
      const allEntries = await prisma.entry.findMany();
      const metrics = await prisma.metric.findMany();

      const updates = users.map(user => {
        const userEntries = allEntries.filter(e => e.user_id === user.id);
        const classElos = calculateUserClassElos(userEntries, allEntries, metrics);
        const totalEloRating = totalElo(classElos);
        const tier = tierFromElo(totalEloRating);

        return prisma.user.update({
          where: { id: user.id },
          data: {
            eloTitan: classElos[FITNESS_CLASSES.TITAN] || 1500,
            eloBeast: classElos[FITNESS_CLASSES.BEAST] || 1500,
            eloBodyweight: classElos[FITNESS_CLASSES.BODYWEIGHT] || 1500,
            eloSuperAthlete: classElos[FITNESS_CLASSES.SUPER_ATHLETE] || 1500,
            eloHunterGatherer: classElos[FITNESS_CLASSES.HUNTER_GATHERER] || 1500,
            eloTotal: totalEloRating,
            tier,
          },
        });
      });

      await prisma.$transaction(updates);
      
      logger.dbEvent('update', 'user', { operation: 'recalculateAllElos', count: users.length });
      
      return { message: `Recalculated Elo for ${users.length} users` };
    } catch (error) {
      logger.error('TRPC Error in user.recalculateAllElos', error as Error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to recalculate Elos',
      });
    }
  }),
}); 