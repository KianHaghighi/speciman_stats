import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/utils/prisma';
import { logger } from '@/utils/logger';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Session } from 'next-auth';

type ContextUser = Session['user'] & {
  id?: string;
};

type ContextSession = Session & {
  user: ContextUser;
};

export async function createContext({ req, res }: CreateNextContextOptions) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    // Ensure session.user has an id
    if (session?.user && typeof session.user === 'object' && 'email' in session.user) {
      const userEmail = session.user.email as string;
      if (userEmail && !('id' in session.user)) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
          if (dbUser) {
            (session.user as ContextUser).id = dbUser.id;
            logger.debug('Patched session.user.id in context', { userId: dbUser.id, email: userEmail });
          }
        } catch (err) {
          logger.error('Error patching session.user.id in context', err as Error, { email: userEmail });
        }
      }
    }

    // Log context creation
    if (session?.user?.id) {
      logger.debug('TRPC context created', { userId: session.user.id });
    }
    
    return {
      req,
      res,
      session,
    } as {
      req: NextApiRequest;
      res: NextApiResponse;
      session: ContextSession | null;
    };
  } catch (error) {
    logger.error('Error creating TRPC context', error as Error, { req: { url: req.url, method: req.method } });
    return {
      req,
      res,
      session: null,
    } as {
      req: NextApiRequest;
      res: NextApiResponse;
      session: ContextSession | null;
    };
  }
}

export type Context = inferAsyncReturnType<typeof createContext>; 