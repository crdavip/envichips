import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.activo) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        // Actualizar último acceso
        await db.user.update({
          where: { id: user.id },
          data: { ultimoAcceso: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          rol: user.rol,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).rol = token.rol;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
