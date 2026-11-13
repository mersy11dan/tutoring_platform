import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/actor";
import { buildGoogleAuthUrl, readGoogleEnv } from "@/lib/google";

export async function GET(request: Request) {
  await requireActor("/admin/google/start");
  const url = buildGoogleAuthUrl(readGoogleEnv(), "pending");
  if (!url) return NextResponse.redirect(new URL("/admin/settings", request.url));
  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(buildGoogleAuthUrl(readGoogleEnv(), state)!);
}
