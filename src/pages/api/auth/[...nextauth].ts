import NextAuth, { NextAuthOptions, User, Account, Session } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/utils/prisma';
import { logger } from '@/utils/logger';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import type { JWT } from 'next-auth/jwt';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type ExtendedUser = User & {
  role?: string | null;
  eloTitan?: number | null;
  eloBeast?: number | null;
  eloBodyweight?: number | null;
  eloSuperAthlete?: number | null;
  eloHunterGatherer?: number | null;
  eloTotal?: number | null;
  tier?: string | null;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds',
          prompt: 'consent',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);
          
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !('password' in user) || !user.password) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          logger.error('Credentials auth error', error as Error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        logger.authEvent('sign_in_attempt', String(user.id ?? ''), { 
          provider: account?.provider,
          email: user.email 
        });
        
        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          logger.authEvent('new_user_created', String(user.id ?? ''), { email: user.email });
        }

        return true;
      } catch (error) {
        logger.error('Sign in callback error', error as Error, { user, account });
        return false;
      }
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      try {
        if (token && session.user) {
          const t = token as Record<string, unknown>;
          // This cast is safe due to next-auth type augmentation
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          const userObj = session.user as unknown as Record<string, unknown>;
          userObj.id = t.id;
          userObj.class = t.class;
          userObj.sex = t.sex;
          userObj.age = t.age;
          userObj.heightCm = t.heightCm;
          userObj.weightKg = t.weightKg;
          userObj.bmi = t.bmi;
          userObj.role = t.role;
          userObj.eloTitan = t.eloTitan;
          userObj.eloBeast = t.eloBeast;
          userObj.eloBodyweight = t.eloBodyweight;
          userObj.eloSuperAthlete = t.eloSuperAthlete;
          userObj.eloHunterGatherer = t.eloHunterGatherer;
          userObj.eloTotal = t.eloTotal;
          userObj.tier = t.tier;
        }
        return session;
      } catch (error) {
        logger.error('Session callback error', error as Error, { session, token });
        return session;
      }
    },
    async jwt({ token, user, account }: { token: JWT; user?: User | undefined; account?: Account | null }) {
      try {
        // Initial sign-in
        if (account && user) {
          const u = user as ExtendedUser;
          const a = account as Record<string, unknown>;
          logger.authEvent('jwt_created', u.id as string, { provider: a.provider });
          // Fetch the user from the database to get all fields
          const dbUser = await prisma.user.findUnique({
            where: { id: u.id as string },
          });
          if (dbUser) {
            const ext = dbUser as ExtendedUser;
            return {
              ...(token as Record<string, unknown>),
              id: ext.id,
              class: ext.class,
              sex: ext.sex,
              age: ext.age,
              heightCm: ext.heightCm,
              weightKg: ext.weightKg,
              bmi: ext.bmi,
              role: ext.role,
              eloTitan: ext.eloTitan,
              eloBeast: ext.eloBeast,
              eloBodyweight: ext.eloBodyweight,
              eloSuperAthlete: ext.eloSuperAthlete,
              eloHunterGatherer: ext.eloHunterGatherer,
              eloTotal: ext.eloTotal,
              tier: ext.tier,
            };
          }
        }
        // Return previous token if the user is already signed in
        return token;
      } catch (error) {
        logger.error('JWT callback error', error as Error, { token, user, account });
        return token;
      }
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // If user profile is incomplete, redirect to onboarding
      if (url === baseUrl || url === baseUrl + '/') {
        // This logic will be handled in the frontend
        return baseUrl;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Security settings
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

export default NextAuth(authOptions); 