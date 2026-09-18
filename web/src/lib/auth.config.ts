import type { NextAuthConfig } from "next-auth";

const PROTECTED_PREFIXES = ["/dashboard", "/avatars", "/projects", "/api/projects", "/api/audio", "/api/backgrounds"];

/**
 * Edge-safe subset of the NextAuth config: no Prisma adapter, no
 * bcrypt-backed Credentials provider (those require the Node.js runtime).
 * `proxy.ts` builds its own lightweight NextAuth instance from this file
 * alone so route protection can run on any runtime, while `auth.ts` layers
 * the full config on top for use in Server Components and Route Handlers.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
      if (!isProtected) return true;
      return isLoggedIn;
    },
  },
};
