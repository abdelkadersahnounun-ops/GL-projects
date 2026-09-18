import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAvatarProvider } from "@/server/avatars";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const avatars = await getAvatarProvider().listAvatars();
  return NextResponse.json({ avatars });
}
