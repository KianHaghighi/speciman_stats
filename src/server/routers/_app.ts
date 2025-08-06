import { initTRPC } from '@trpc/server';
import { metricsRouter } from './metrics';
import { userRouter } from './user';

const t = initTRPC.create();

export const appRouter = t.router({
  metrics: metricsRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter; 