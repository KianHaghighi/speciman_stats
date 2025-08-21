import { initTRPC, TRPCError } from '@trpc/server';
import { prisma } from '@/utils/prisma';
import { z } from 'zod';
import type { Context } from '../context';
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

const protectedProcedure = t.procedure.use(isAuthed);

export const gymsRouter = t.router({
  all: protectedProcedure.query(async () => {
    try {
      logger.dbEvent('select', 'gym', { operation: 'findMany' });
      
      const gyms = await prisma.gym.findMany({
        select: {
          id: true,
          name: true,
          street: true,
          city: true,
          state: true,
          country: true,
          lat: true,
          lng: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      
      return gyms.map(gym => ({
        id: gym.id,
        name: gym.name,
        street: gym.street,
        city: gym.city,
        state: gym.state,
        country: gym.country,
        lat: gym.lat,
        lng: gym.lng,
        memberCount: gym._count.users,
      }));
    } catch (error) {
      logger.error('TRPC Error in gyms.all', error as Error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch gyms. Please try again later.',
      });
    }
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        logger.dbEvent('select', 'gym', { operation: 'findUnique', gymId: input.id });
        
        const gym = await prisma.gym.findUnique({
          where: { id: input.id },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                overallElo: true,
              },
              orderBy: { overallElo: 'desc' },
            },
            _count: {
              select: {
                users: true,
              },
            },
          },
        });
        
        if (!gym) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gym not found',
          });
        }
        
        return {
          id: gym.id,
          name: gym.name,
          street: gym.street,
          city: gym.city,
          state: gym.state,
          country: gym.country,
          lat: gym.lat,
          lng: gym.lng,
          memberCount: gym._count.users,
          users: gym.users,
        };
      } catch (error) {
        logger.error('TRPC Error in gyms.byId', error as Error, { input });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch gym. Please try again later.',
        });
      }
    }),

  search: protectedProcedure
    .input(z.object({ 
      query: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        logger.dbEvent('select', 'gym', { operation: 'search', query: input.query });
        
        const where: any = {};
        
        if (input.query) {
          where.OR = [
            { name: { contains: input.query, mode: 'insensitive' } },
            { city: { contains: input.query, mode: 'insensitive' } },
            { state: { contains: input.query, mode: 'insensitive' } },
          ];
        }
        
        if (input.city) {
          where.city = { contains: input.city, mode: 'insensitive' };
        }
        
        if (input.state) {
          where.state = { contains: input.state, mode: 'insensitive' };
        }
        
        const gyms = await prisma.gym.findMany({
          where,
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            lat: true,
            lng: true,
            _count: {
              select: {
                users: true,
              },
            },
          },
          orderBy: { name: 'asc' },
          take: 20,
        });
        
        return gyms.map(gym => ({
          id: gym.id,
          name: gym.name,
          city: gym.city,
          state: gym.state,
          lat: gym.lat,
          lng: gym.lng,
          memberCount: gym._count.users,
        }));
      } catch (error) {
        logger.error('TRPC Error in gyms.search', error as Error, { input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search gyms. Please try again later.',
        });
      }
    }),
});
