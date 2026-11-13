import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authorize, type Actor } from "@/domain/access";
import type { HiringStatus } from "@/domain/hiring";
import { adminEmails } from "@/lib/env";
import { openSession, sealSession, sessionSecret } from "@/lib/session-token";
import { getStore } from "@/lib/store";
import type { Application, PublicUser } from "@/lib/store/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/service";

const COOKIE = "studio_session";

export function toActor(user: PublicUser, application: Application | null): Actor {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    accountType: user.accountType,
    hiringStatus: application?.hiringStatus ?? null,
    isAdmin: adminEmails().includes(user.email),
  };
}

export async function persistActor(actor: Actor) {
  if (isSupabaseConfigured()) return;
  const token = await sealSession(
    {
      sub: actor.id,
      email: actor.email,
      fullName: actor.fullName,
      accountType: actor.accountType,
      hiringStatus: actor.hiringStatus,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    sessionSecret(),
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearActor() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
}

export async function getActor(): Promise<Actor | null> {
  const store = getStore();
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    const sub = data?.claims?.sub;
    if (!sub) return null;
    const user = await store.getUser(sub);
    if (!user) return null;
    return toActor(user, await store.getApplicationByUserId(user.id));
  }
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const claims = await openSession(token, sessionSecret());
  if (!claims) return null;
  const user = await store.getUser(claims.sub);
  if (!user) return null;
  return toActor(user, await store.getApplicationByUserId(user.id));
}

export async function requireActor(path: string): Promise<Actor> {
  const actor = await getActor();
  const decision = authorize(path, actor);
  if (!decision.ok || !actor) redirect(decision.ok ? "/teachers/sign-in" : decision.redirectTo);
  return actor;
}

export function actorHiringStatus(value: string | null): HiringStatus | null {
  return value as HiringStatus | null;
}
