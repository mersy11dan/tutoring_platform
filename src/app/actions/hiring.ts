"use server";

import { redirect } from "next/navigation";
import { parseGradeList } from "@/domain/grades";
import {
  decideApprovals,
  isInterviewOutcome,
  scoreError,
  type GradeScores,
} from "@/domain/hiring";
import { GRADES } from "@/domain/grades";
import { requireActor } from "@/lib/actor";
import { addisInputToIso, text } from "@/lib/format";
import { getStore } from "@/lib/store";
import { StoreError } from "@/lib/store/types";
import type { FormState } from "@/components/action-form";

function emailOk(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitApplication(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const fullName = text(formData, "fullName");
    const email = text(formData, "email").toLowerCase();
    const password = text(formData, "password");
    const phone = text(formData, "phone");
    const education = text(formData, "education");
    const experience = text(formData, "experience");
    const statement = text(formData, "statement");
    const requestedGrades = parseGradeList(formData.getAll("requestedGrades"));
    if (fullName.length < 2) throw new StoreError("Enter your full name.");
    if (!emailOk(email)) throw new StoreError("Enter a valid email address.");
    if (password.length < 8) throw new StoreError("Choose a password of at least 8 characters.");
    if (phone.length < 7) throw new StoreError("Enter a phone number.");
    if (education.length < 2) throw new StoreError("Enter your education.");
    if (experience.length < 2) throw new StoreError("Enter your experience.");
    if (statement.length < 20) throw new StoreError("Write a short statement of at least 20 characters.");
    if (requestedGrades.length === 0) throw new StoreError("Choose at least one grade.");
    const { user, application } = await getStore().submitApplication({
      fullName,
      email,
      password,
      phone,
      education,
      experience,
      requestedGrades,
      statement,
    });
    const { persistActor, toActor } = await import("@/lib/actor");
    const { isSupabaseConfigured } = await import("@/lib/supabase/service");
    if (isSupabaseConfigured()) {
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new StoreError("The application was saved. Sign in to see its status.");
    } else {
      await persistActor(toActor(user, application));
    }
    redirect("/teachers/apply/status");
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}

async function adminStore() {
  await requireActor("/admin");
  return getStore();
}

export async function scheduleInterview(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const store = await adminStore();
    const applicationId = text(formData, "applicationId");
    const scheduledAt = addisInputToIso(text(formData, "scheduledAt"));
    const interviewerEmail = text(formData, "interviewerEmail").toLowerCase();
    if (!scheduledAt) throw new StoreError("Choose a date and time. Times are in Africa/Addis Ababa.");
    if (interviewerEmail && !emailOk(interviewerEmail)) throw new StoreError("Enter a valid interviewer email, or leave it blank.");
    await store.scheduleInterview({ applicationId, scheduledAt, interviewerEmail });
    redirect(`/admin/applications/${applicationId}`);
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}

export async function recordInterview(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const store = await adminStore();
    const interviewId = text(formData, "interviewId");
    const outcome = text(formData, "outcome");
    if (!isInterviewOutcome(outcome)) throw new StoreError("Choose advance, hold, or reject.");
    const interview = await store.recordInterview({ interviewId, notes: text(formData, "notes"), outcome });
    redirect(`/admin/applications/${interview.applicationId}`);
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}

export async function startAssessment(formData: FormData) {
  const store = await adminStore();
  const applicationId = text(formData, "applicationId");
  await store.startAssessment(applicationId);
  redirect(`/admin/assessments/${applicationId}`);
}

function readScores(formData: FormData): GradeScores {
  const scores: GradeScores = {};
  for (const grade of GRADES) {
    const raw = text(formData, `score_${grade}`);
    if (!raw) continue;
    const score = Number(raw);
    const message = scoreError(score);
    if (message) throw new StoreError(message);
    scores[grade] = score;
  }
  return scores;
}

export async function saveAssessment(_state: FormState, formData: FormData): Promise<FormState> {
  try {
    const store = await adminStore();
    const applicationId = text(formData, "applicationId");
    const intent = text(formData, "intent");
    const existing = await store.getAssessmentForApplication(applicationId);
    const scores = { ...(existing?.scores ?? {}), ...readScores(formData) };
    const sampleLessonNotes = text(formData, "sampleLessonNotes") || existing?.sampleLessonNotes || "";
    if (intent === "save" || intent === "assessed" || intent === "approve") {
      if (!existing) throw new StoreError("Start the assessment before entering scores.");
      await store.saveScores({ applicationId, scores, sampleLessonNotes });
    }
    if (intent === "assessed") {
      await store.markAssessed(applicationId);
      redirect(`/admin/assessments/${applicationId}`);
    }
    if (intent === "approve") {
      const useOverride = formData.get("useOverride") === "yes";
      const decision = decideApprovals({
        scores,
        confirmEligible: formData.get("confirmEligible") === "yes",
        confirmAllFour: formData.get("confirmAllFour") === "yes",
        overrideGrades: useOverride ? parseGradeList(formData.getAll("overrideGrade")) : undefined,
        overrideReason: text(formData, "overrideReason"),
      });
      if (!decision.ok) throw new StoreError(decision.error);
      await store.approveApplication(applicationId, decision.decision);
      redirect(`/admin/teachers`);
    }
    if (intent === "reject") {
      await store.setHiringStatus(applicationId, "rejected");
      redirect(`/admin/applications/${applicationId}`);
    }
    if (intent === "hold") {
      await store.setHiringStatus(applicationId, "on_hold");
      redirect(`/admin/applications/${applicationId}`);
    }
    redirect(`/admin/assessments/${applicationId}`);
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}
