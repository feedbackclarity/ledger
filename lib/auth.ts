import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Password',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const expected = process.env.LEDGER_PASSWORD;
        if (!expected) {
          console.error('LEDGER_PASSWORD not set');
          return null;
        }
        if (credentials?.password === expected) {
          return { id: 'owner', name: 'Owner' };
        }
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};
