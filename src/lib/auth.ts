import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "./airtable";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasenya", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("missing-credentials");
        }

        const user = await getUserByEmail(credentials.email);

        if (!user) {
          throw new Error("no-user");
        }

        // Enforce manual approval
        if (!user.aprovat) {
          throw new Error("not-approved");
        }

        // Verify password hash
        const isPasswordValid = bcrypt.compareSync(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error("wrong-password");
        }

        return {
          id: user.id,
          name: user.nom,
          email: user.email,
          centreId: user.centreId || "",
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.centreId = user.centreId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.centreId = token.centreId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dies
  },
  secret: process.env.NEXTAUTH_SECRET,
};
