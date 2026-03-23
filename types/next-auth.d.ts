import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      org_id?: string;
    };
  }

  interface User {
    role?: string;
    org_id?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    org_id?: string;
  }
}