import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const config = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Import db lazily to avoid build-time execution
        const { default: db } = await import("@/lib/db");
        
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(credentials.email) as { id: number; email: string; password: string; name: string | null } | undefined;

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

// @ts-ignore - NextAuth v5 beta has some TypeScript issues with Next.js 16 build
export const { handlers, signIn, signOut, auth } = NextAuth(config);
