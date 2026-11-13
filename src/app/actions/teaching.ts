"use server";

import { redirect } from "next/navigation";
import { parseGrade, parseGradeList } from "@/domain/grades";
import { requireActor } from "@/lib/actor";
import { addisInputToIso, text } from "@/lib/format";
import { GOOGLE_NOT_CONNECTED, createClassroomAdapter, createMeetAdapter, readGoogleEnv } from "@/lib/google";
import { getStore } from "@/lib/store";
import { StoreError } from "@/lib/store/types";
import type { FormState } from "@/components/action-form";

export async function saveTeachingGrades(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor("/teachers/grades");
  try {
    await getStore().setOptIn(actor.id, parseGradeList(formData.getAll("grades")));
    redirect("/teachers/grades");
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}

export async function createLesson(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor(text(formData, "returnTo") || "/teachers/sessions/new");
  try {
    const store = getStore();
    const grade = parseGrade(text(formData, "grade"));
    const title = text(formData, "title");
    const startsAt = addisInputToIso(text(formData, "startsAt"));
    const endsAt = addisInputToIso(text(formData, "endsAt"));
    const manualLink = text(formData, "meetLink");
    const teacherId = actor.isAdmin && text(formData, "teacherId") ? text(formData, "teacherId") : actor.id;
    if (!grade) throw new StoreError("Choose a grade.");
    if (title.length < 2) throw new StoreError("Name the lesson.");
    if (!startsAt || !endsAt) throw new StoreError("Choose a start and end. Times are in Africa/Addis Ababa.");
    if (actor.accountType !== "teacher" && !actor.isAdmin) throw new StoreError("You cannot schedule a lesson.");
    let meetLink: string | null = manualLink || null;
    let meetSource: "manual" | "google" = "manual";
    if (text(formData, "meetMode") === "google") {
      const created = await createMeetAdapter(readGoogleEnv()).createMeetLink({ title, startsAt, endsAt });
      if (!created.ok) throw new StoreError(created.message || GOOGLE_NOT_CONNECTED);
      meetLink = created.link;
      meetSource = "google";
    } else if (manualLink && !/^https:\/\/.+/i.test(manualLink)) {
      throw new StoreError("Paste a full https Meet link, or leave it blank.");
    }
    await store.createSession({
      grade,
      teacherId,
      title,
      startsAt,
      endsAt,
      meetLink,
      meetSource,
      createdBy: actor.id,
    });
    redirect(actor.isAdmin ? "/admin/sessions" : "/teachers/sessions");
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}

export async function cancelLesson(formData: FormData) {
  const { getActor } = await import("@/lib/actor");
  const { authorize } = await import("@/domain/access");
  const actor = await getActor();
  if (!actor) redirect("/teachers/sign-in");
  const allowed = authorize("/teachers/sessions", actor).ok || authorize("/admin/sessions", actor).ok;
  if (!allowed) redirect(actor.isAdmin ? "/admin" : "/teachers/apply/status");
  if (text(formData, "confirm") !== "yes") return;
  const store = getStore();
  const session = await store.getSession(text(formData, "sessionId"));
  if (!session) return;
  if (!actor.isAdmin && session.teacherId !== actor.id) return;
  await store.setSessionStatus(session.id, "cancelled");
  redirect(actor.isAdmin ? "/admin/sessions" : "/teachers/sessions");
}

export async function createAssignment(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor("/teachers/assignments");
  try {
    const grade = parseGrade(text(formData, "grade"));
    const title = text(formData, "title");
    const instructions = text(formData, "instructions");
    const dueRaw = text(formData, "dueAt");
    const dueAt = dueRaw ? addisInputToIso(dueRaw) : null;
    if (!grade) throw new StoreError("Choose a grade.");
    if (title.length < 2) throw new StoreError("Name the assignment.");
    if (dueRaw && !dueAt) throw new StoreError("The due date is not valid. Times are in Africa/Addis Ababa.");
    const store = getStore();
    const assignment = await store.createAssignment({
      grade,
      teacherId: actor.id,
      title,
      instructions,
      dueAt,
    });
    if (text(formData, "classroom") === "yes") {
      const google = readGoogleEnv();
      const courseId = text(formData, "courseId");
      const adapter = createClassroomAdapter(google);
      let resolvedCourse = courseId;
      if (!resolvedCourse) {
        const course = await adapter.createCourse(`Grade ${grade} mathematics`);
        if (!course.ok) throw new StoreError(course.message);
        resolvedCourse = course.value.courseId;
      }
      const work = await adapter.createCourseWork({
        courseId: resolvedCourse,
        title,
        description: instructions,
        dueAt,
      });
      if (!work.ok) throw new StoreError(work.message);
      await store.attachClassroom(assignment.id, resolvedCourse, work.value.courseworkId);
    }
    redirect("/teachers/assignments");
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}
