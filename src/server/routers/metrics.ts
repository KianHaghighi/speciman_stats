import { initTRPC, TRPCError } from '@trpc/server';
import { prisma } from '@/utils/prisma';
import { z } from 'zod';
import type { Context } from '../context';

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    console.error('TRPC Auth Error: No user in session. Context:', ctx);
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You are not logged in. Please sign in again. If this error persists, try clearing your cookies and refreshing the page.',
    });
  }
  return next({ ctx });
});

const protectedProcedure = t.procedure.use(isAuthed);

export const metricsRouter = t.router({
  all: protectedProcedure.query(async () => {
    try {
      return await prisma.metric.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error('TRPC Error in metrics.all:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch metrics. Please try again later. Details: ' + (error instanceof Error ? error.message : String(error)),
      });
    }
  }),

  allEntries: protectedProcedure.query(async () => {
    try {
      return await prisma.userMetricEntry.findMany({
        include: {
          metric: {
            select: {
              id: true,
              name: true,
              slug: true,
              higherIsBetter: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('TRPC Error in metrics.allEntries:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch entries. Please try again later. Details: ' + (error instanceof Error ? error.message : String(error)),
      });
    }
  }),

  userEntries: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await prisma.userMetricEntry.findMany({
        where: {
          userId: ctx.session!.user.id,
        },
        include: {
          metric: {
            select: {
              id: true,
              name: true,
              slug: true,
              higherIsBetter: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('TRPC Error in metrics.userEntries:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user entries. Please try again later. Details: ' + (error instanceof Error ? error.message : String(error)),
      });
    }
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const metric = await prisma.metric.findUnique({
          where: { id: input.id },
        });
        
        if (!metric) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Metric not found',
          });
        }
        
        return metric;
      } catch (error) {
        console.error(error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch metric',
        });
      }
    }),

  entries: protectedProcedure
    .input(z.object({ metricId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await prisma.userMetricEntry.findMany({
          where: { metricId: input.metricId },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch entries',
        });
      }
    }),

  leaderboard: protectedProcedure
    .input(z.object({ metricId: z.string() }))
    .query(async ({ input }) => {
      try {
        const metric = await prisma.metric.findUnique({
          where: { id: input.metricId },
        });

        if (!metric) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Metric not found',
          });
        }

        // Get the best entry for each user
        const bestEntries = await prisma.$queryRaw`
          WITH RankedEntries AS (
            SELECT 
              e.*,
              ROW_NUMBER() OVER (PARTITION BY e."userId" ORDER BY e.value DESC) as rank
            FROM "UserMetricEntry" e
            WHERE e."metricId" = ${input.metricId}
          )
          SELECT * FROM RankedEntries
          WHERE rank = 1
          ORDER BY value DESC
          LIMIT 100
        `;

        // Get user details for each entry
        const entriesWithUsers = await Promise.all(
          (bestEntries as Array<{ userId: string; [key: string]: unknown }>).map(async (entry) => {
            const user = await prisma.user.findUnique({
              where: { id: entry.userId },
              select: { name: true, image: true },
            });
            return {
              ...entry,
              user,
            };
          })
        );

        return entriesWithUsers;
      } catch (error) {
        console.error(error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch leaderboard',
        });
      }
    }),

  addEntry: protectedProcedure
    .input(z.object({
      metricId: z.string(),
      value: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const metric = await prisma.metric.findUnique({
          where: { id: input.metricId },
        });

        if (!metric) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Metric not found',
          });
        }

        return await prisma.userMetricEntry.create({
          data: {
            metricId: input.metricId,
            userId: ctx.session!.user.id,
            value: input.value,
          },
        });
      } catch (error) {
        console.error(error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add entry',
        });
      }
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      unit: z.string().min(1).max(20),
    }))
    .mutation(async ({ input }) => {
      try {
        return await prisma.metric.create({
          data: {
            name: input.name,
            unit: input.unit,
          },
        });
      } catch (error: unknown) {
        console.error(error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A metric with this name already exists',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create metric',
        });
      }
    }),
}); 