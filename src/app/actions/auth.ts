"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/domain/access";
import { clearActor, getActor, persistActor, toActor } from "@/lib/actor";
import { demoSignInAllowed } from "@/lib/session-token";
import { getStore } from "@/lib/store";
import { getDemoStore } from "@/lib/store/demo-store";
import { StoreError } from "@/lib/store/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/service";
import { text } from "@/lib/format";
import type { FormState } from "@/components/action-form";

function emailError(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return null;
}

async function signIn(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const invalid = emailError(normalized);
  if (invalid) throw new StoreError(invalid);
  if (password.length < 8) throw new StoreError("Password must be at least 8 characters.");
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error || !data.user) throw new StoreError("Email or password does not match.");
    const user = await getStore().getUser(data.user.id);
    if (!user) throw new StoreError("Email or password does not match.");
    const application = await getStore().getApplicationByUserId(user.id);
    return toActor(user, application);
  }
  if (!demoSignInAllowed()) throw new StoreError("Demo sign-in is disabled until Supabase is connected.");
  const user = await getDemoStore().authenticate(normalized, password);
  if (!user) throw new StoreError("Email or password does not match.");
  const application = await getDemoStore().getApplicationByUserId(user.id);
  const actor = toActor(user, application);
  await persistActor(actor);
  return actor;
}

export async function signInStudent(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await signIn(text(formData, "email"), text(formData, "password"));
    if (actor.accountType !== "student") {
      await clearActor();
      throw new StoreError("This is not a student account. Use teacher sign in.");
    }
    redirect(safeNext(text(formData, "next"), "/students/dashboard"));
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}

export async function signUpStudent(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const fullName = text(formData, "fullName");
    const email = text(formData, "email").toLowerCase();
    const password = text(formData, "password");
    if (fullName.length < 2) throw new StoreError("Enter your full name.");
    const invalid = emailError(email);
    if (invalid) throw new StoreError(invalid);
    if (password.length < 8) throw new StoreError("Password must be at least 8 characters.");
    const user = await getStore().createStudent({ fullName, email, password });
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new StoreError("The account was created. Sign in to continue.");
    } else {
      await persistActor(toActor(user, null));
    }
    redirect("/students/enroll");
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}

export async function signInTeacher(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await signIn(text(formData, "email"), text(formData, "password"));
    if (actor.accountType === "student") {
      await clearActor();
      throw new StoreError("This is a student account. Use student sign in.");
    }
    const next = safeNext(text(formData, "next"), "");
    if (next.startsWith("/admin") && actor.isAdmin) redirect(next);
    if (actor.hiringStatus === "approved") redirect(next.startsWith("/teachers") ? next : "/teachers/dashboard");
    if (actor.isAdmin) redirect(next.startsWith("/admin") ? next : "/admin");
    redirect("/teachers/apply/status");
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}

export async function signOut() {
  await clearActor();
  redirect("/");
}

export async function refreshTeacherSession(): Promise<void> {
  const actor = await getActor();
  if (!actor) redirect("/teachers/sign-in");
  if (!isSupabaseConfigured()) await persistActor(actor);
  else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.refreshSession();
  }
  if (actor.hiringStatus === "approved") redirect("/teachers/dashboard");
  if (actor.isAdmin) redirect("/admin");
  redirect("/teachers/apply/status");
}
