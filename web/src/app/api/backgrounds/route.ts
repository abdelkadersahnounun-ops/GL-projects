import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listBackgrounds } from "@/server/backgrounds";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const backgrounds = await listBackgrounds();
  return NextResponse.json({ backgrounds });
}
