import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import LinkedInProvider from 'next-auth/providers/linkedin';
import FacebookProvider from 'next-auth/providers/facebook';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { comparePasswords } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required');
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, credentials.username))
          .limit(1);

        if (!user) {
          throw new Error('Invalid username or password');
        }

        if (!user.password) {
          throw new Error('Invalid username or password');
        }
        const isValidPassword = await comparePasswords(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid username or password');
        }

        return {
          id: user.id.toString(),
          name: user.name || user.username,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account && account.provider !== 'credentials') {
        const email = user?.email || (profile as any)?.email || null;
        const provider = account.provider;
        const providerAccountId = account.providerAccountId;
        if (!email) return false;
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length === 0) {
          const baseUsername = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '');
          const uniqueUsername = `${baseUsername}_${Math.random().toString(36).slice(2, 8)}`;
          await db.insert(users).values({
            email,
            username: uniqueUsername,
            name: user.name || uniqueUsername,
            role: 'caller',
            authProvider: provider as any,
            providerAccountId,
            active: true,
            oauthEmailVerifiedAt: new Date(),
          });
        } else {
          await db
            .update(users)
            .set({ authProvider: provider as any, providerAccountId })
            .where(eq(users.email, email));
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
