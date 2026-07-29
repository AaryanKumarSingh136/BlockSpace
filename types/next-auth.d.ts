import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
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

  interface User {
    id?: string;
    role?: string;
    org_id?: string;
    club_id?: string;
    dept_id?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    org_id?: string;
    club_id?: string;
    dept_id?: string;
  }
}