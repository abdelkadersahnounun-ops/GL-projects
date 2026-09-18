import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

// Lightweight, edge-safe NextAuth instance used only to guard routes here.
// The full instance (Prisma adapter, Credentials provider) lives in
// src/lib/auth.ts and is used by Server Components / Route Handlers.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/files|.*\\.(?:png|jpg|jpeg|svg|ico|mp4|mp3)$).*)"],
};
