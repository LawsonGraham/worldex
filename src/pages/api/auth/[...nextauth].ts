import NextAuth, { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'worldcoin',
      name: 'Worldcoin',
      type: 'oauth',
      wellKnown: 'https://id.worldcoin.org/.well-known/openid-configuration',
      authorization: { params: { scope: 'openid' } },
      clientId: process.env.WLD_CLIENT_ID,
      clientSecret: process.env.WLD_CLIENT_SECRET,
      idToken: true,
      checks: ['state', 'nonce', 'pkce'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.sub,
          verificationLevel:
            profile['https://id.worldcoin.org/v1'].verification_level,
        };
      },
    },
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token }) {
      token.userRole = 'admin';
      return token;
    },
  },
  // Configure URLs for Vercel deployment
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
