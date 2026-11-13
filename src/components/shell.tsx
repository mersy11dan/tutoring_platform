import Link from "next/link";
import type { ReactNode } from "react";
import type { Actor } from "@/domain/access";
import { signOut } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/service";
import { googleConnection, readGoogleEnv } from "@/lib/google";
import { PendingButton } from "./action-form";
import { SideNav } from "./side-nav";
import { Wordmark } from "./wordmark";

export function PublicHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Wordmark />
        <nav aria-label="Sign in" className="flex flex-wrap gap-4 text-[0.9375rem]">
          <Link href="/students/sign-in" className="link">
            Students
          </Link>
          <Link href="/teachers/sign-in" className="link">
            Teachers
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function StudioFrame({
  actor,
  area,
  items,
  children,
  showGoogle = false,
}: {
  actor: Actor;
  area: string;
  items: { href: string; label: string; exact?: boolean }[];
  children: ReactNode;
  showGoogle?: boolean;
}) {
  const google = googleConnection(readGoogleEnv());
  return (
    <div className="min-h-dvh">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Wordmark />
            <p className="text-sm text-gray-700">{area}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-gray-700">{actor.fullName}</p>
            <form action={signOut}>
              <PendingButton className="btn btn-secondary" pendingLabel="Signing out…">
                Sign out
              </PendingButton>
            </form>
          </div>
        </div>
      </header>
      {!isSupabaseConfigured() ? (
        <p className="banner bg-brand-800 text-white" role="status">
          Local demo. Supabase is not connected, so this browser is using sample data on this machine.
        </p>
      ) : null}
      {showGoogle && !google.connected ? (
        <p className="banner border-b border-warning-100 bg-warning-50 text-warning-800" role="status">
          Google not connected yet
        </p>
      ) : null}
      <div className="mx-auto grid max-w-6xl md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
        <SideNav items={items} label={area} />
        <main id="main" className="min-w-0 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
