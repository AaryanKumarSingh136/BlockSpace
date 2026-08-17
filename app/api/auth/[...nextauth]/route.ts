import NextAuth, { User as NextAuthUser, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface ExtendedUser extends NextAuthUser {
  id?: string;
  role?: string;
  org_id?: string;
  club_id?: string;
  dept_id?: string;
}

interface ExtendedSession extends Session {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    org_id?: string;
    club_id?: string;
    dept_id?: string;
  };
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const ip = getClientIp(req as Request);
        const rateCheck = checkRateLimit(`auth_signin_${ip}`, 10, 15 * 60 * 1000);

        if (!rateCheck.success) {
          throw new Error(`Too many login attempts. Try again in ${rateCheck.reset} seconds.`);
        }

        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          org_id: user.org_id?.toString(),
          club_id: user.club_id?.toString(),
          dept_id: user.dept_id?.toString(),
        } as ExtendedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const extUser = user as ExtendedUser;
        token.id = extUser.id;
        token.role = extUser.role;
        token.org_id = extUser.org_id;
        token.club_id = extUser.club_id;
        token.dept_id = extUser.dept_id;
      }
      // Re-fetch latest user role/org/club/dept on session update or token refresh
      if (token.id && (!token.org_id || trigger === 'update')) {
        await connectDB();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.role = dbUser.role;
          token.org_id = dbUser.org_id?.toString();
          token.club_id = dbUser.club_id?.toString();
          token.dept_id = dbUser.dept_id?.toString();
        }
      }
      return token;
    },
    async session({ session, token }: { session: ExtendedSession; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.org_id = token.org_id as string;
        session.user.club_id = token.club_id as string;
        session.user.dept_id = token.dept_id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };