import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/utils/prisma';
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  allowDangerousEmailAccountLinking: process.env.NODE_ENV !== 'production',
  providers: [
    // Credentials Provider (Email/Phone + Password)
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        identifier: { 
          label: 'Email or Phone', 
          type: 'text', 
          placeholder: 'Enter your email or phone number' 
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          // Check if identifier is email or phone
          const isEmail = credentials.identifier.includes('@');
          
          let user;
          if (isEmail) {
            user = await prisma.user.findUnique({
              where: { email: credentials.identifier }
            });
          } else {
            // For phone, we'll need to add a phone field to User model later
            // For now, just check email
            user = await prisma.user.findUnique({
              where: { email: credentials.identifier }
            });
          }

          if (!user || !user.password) {
            return null;
          }

          // Verify password with bcrypt
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            return null;
          }

          return user;
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      }
    }),

    // Discord Provider
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),

    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Apple Provider
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: Number(process.env.SESSION_MAX_AGE_SECONDS || 900), // 15 minutes default
    updateAge: 0, // Don't update session age
  },

  jwt: {
    maxAge: Number(process.env.SESSION_MAX_AGE_SECONDS || 900), // 15 minutes default
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        // allow same-origin absolute URLs and any relative URL
        if (u.origin === baseUrl || url.startsWith("/")) return u.toString();
      } catch {}
      // default landing page after auth
      return `${baseUrl}/dashboard`;
    },

    /**
     * Dev fallback: if NextAuth still throws OAuthAccountNotLinked,
     * proactively create the Account row for the existing user with same email.
     */
    async signIn({ user, account, profile }) {
      if (
        process.env.NODE_ENV !== "production" &&
        account?.type === "oauth" &&
        profile &&
        "email" in profile &&
        profile.email
      ) {
        // Find existing user by email
        const existing = await prisma.user.findUnique({
          where: { email: String(profile.email) },
        });

        // If the user exists, ensure there is an Account row for this provider
        if (existing) {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId!,
              },
            },
            update: {},
            create: {
              userId: existing.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId!,
              access_token: account.access_token ?? null,
              token_type: account.token_type ?? null,
              id_token: account.id_token ?? null,
              refresh_token: account.refresh_token ?? null,
              scope: account.scope ?? null,
              expires_at: account.expires_at ?? null,
              session_state: (account as any).session_state ?? null,
            },
          });
          return true; // proceed
        }
      }
      return true; // default allow
    },
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/signup',
    error: '/auth/error',
  },

  debug: process.env.NODE_ENV === 'development',

  events: {
    async linkAccount(message) {
      console.log("[next-auth] linked account", {
        provider: message.account?.provider,
        providerAccountId: message.account?.providerAccountId,
        userId: message.user?.id,
      });
    },
  },
};

export default NextAuth(authOptions); 