import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireActor } from "@/lib/actor";
import { exchangeGoogleCode, readGoogleEnv } from "@/lib/google";

export async function GET(request: Request) {
  await requireActor("/admin/google/callback");
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const expected = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const destination = new URL("/admin/google/result", request.url);
  if (!code || !state || state !== expected || url.searchParams.get("error")) {
    destination.searchParams.set("error", "1");
    return NextResponse.redirect(destination);
  }
  const result = await exchangeGoogleCode(readGoogleEnv(), code);
  if (!result.ok) {
    destination.searchParams.set("error", "1");
    return NextResponse.redirect(destination);
  }
  cookieStore.set("google_refresh_display", result.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin/google/result",
    maxAge: 120,
  });
  return NextResponse.redirect(destination);
}
