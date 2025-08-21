import { initTRPC } from '@trpc/server';
import { metricsRouter } from './metrics';
import { userRouter } from './user';
import { gymsRouter } from './gyms';

const t = initTRPC.create();

export const appRouter = t.router({
  metrics: metricsRouter,
  user: userRouter,
  gyms: gymsRouter,
});

export type AppRouter = typeof appRouter; 