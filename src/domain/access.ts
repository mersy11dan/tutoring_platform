import type { HiringStatus } from "./hiring";

export type AccountType = "student" | "teacher" | "admin";

export type Actor = {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  hiringStatus: HiringStatus | null;
  isAdmin: boolean;
};

export type AuthDecision = { ok: true } | { ok: false; redirectTo: string };

const PUBLIC_PATHS = new Set([
  "/",
  "/students/sign-in",
  "/students/sign-up",
  "/teachers/sign-in",
  "/teachers/apply",
]);

export function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function safeNext(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return fallback;
  }
  return value;
}

function homeFor(actor: Actor): string {
  if (actor.isAdmin && actor.accountType !== "student" && actor.hiringStatus !== "approved") return "/admin";
  if (actor.accountType === "student") return "/students/dashboard";
  if (actor.hiringStatus === "approved") return "/teachers/dashboard";
  if (actor.isAdmin) return "/admin";
  return "/teachers/apply/status";
}

export function authorize(pathname: string, actor: Actor | null): AuthDecision {
  const path = normalizePath(pathname);
  if (PUBLIC_PATHS.has(path)) return { ok: true };

  if (path.startsWith("/admin")) {
    if (!actor) return { ok: false, redirectTo: "/teachers/sign-in?next=/admin" };
    if (!actor.isAdmin) return { ok: false, redirectTo: homeFor(actor) };
    return { ok: true };
  }

  if (path === "/teachers/apply/status") {
    if (!actor) return { ok: false, redirectTo: "/teachers/sign-in?next=/teachers/apply/status" };
    if (actor.accountType === "student") return { ok: false, redirectTo: "/students/dashboard" };
    return { ok: true };
  }

  if (path.startsWith("/teachers")) {
    if (!actor) return { ok: false, redirectTo: `/teachers/sign-in?next=${encodeURIComponent(path)}` };
    if (actor.accountType !== "teacher" || actor.hiringStatus !== "approved") {
      if (actor.accountType === "student") return { ok: false, redirectTo: "/students/dashboard" };
      return { ok: false, redirectTo: actor.isAdmin ? "/admin" : "/teachers/apply/status" };
    }
    return { ok: true };
  }

  if (path.startsWith("/students")) {
    if (!actor) return { ok: false, redirectTo: `/students/sign-in?next=${encodeURIComponent(path)}` };
    if (actor.accountType !== "student") return { ok: false, redirectTo: homeFor(actor) };
    return { ok: true };
  }

  return { ok: true };
}
