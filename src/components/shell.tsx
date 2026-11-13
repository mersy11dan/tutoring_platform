import Link from "next/link";
import type { ReactNode } from "react";
import type { Actor } from "@/domain/access";
import { signOut } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/service";
import { googleConnection, readGoogleEnv } from "@/lib/google";
import { PendingButton } from "./action-form";
import { SideNav } from "./side-nav";

export function PublicHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-display text-2xl text-brand-900 no-underline" translate="no">
          Kony & Sisay
        </Link>
        <nav aria-label="Sign in" className="flex gap-4 text-[15px]">
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
  items,
  children,
  showGoogle = false,
}: {
  actor: Actor;
  items: { href: string; label: string; exact?: boolean }[];
  children: ReactNode;
  showGoogle?: boolean;
}) {
  const google = googleConnection(readGoogleEnv());
  return (
    <div className="min-h-dvh">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="font-display text-2xl text-brand-900 no-underline" translate="no">
            Kony & Sisay
          </Link>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-gray-700 sm:block">{actor.fullName}</p>
            <form action={signOut}>
              <PendingButton className="btn btn-secondary" pendingLabel="Signing out…">
                Sign out
              </PendingButton>
            </form>
          </div>
        </div>
      </header>
      {!isSupabaseConfigured() ? (
        <p className="bg-brand-800 px-4 py-2 text-center text-sm text-white">
          Local demo. Supabase is not connected, so this browser is using sample data on this machine.
        </p>
      ) : null}
      {showGoogle && !google.connected ? (
        <p className="border-b border-warning-100 bg-warning-50 px-4 py-2 text-center text-sm text-warning-800">
          Google not connected yet
        </p>
      ) : null}
      <div className="mx-auto grid max-w-6xl md:grid-cols-[14rem_minmax(0,1fr)]">
        <SideNav items={items} />
        <main id="main" className="min-w-0 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
