import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import type { GetServerSidePropsContext } from 'next';

export async function getSession(ctx: GetServerSidePropsContext) {
  return getServerSession(ctx.req, ctx.res, authOptions);
} 