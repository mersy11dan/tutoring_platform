"use server";

import { redirect } from "next/navigation";
import { parseGrade } from "@/domain/grades";
import { planStudentEnrollment } from "@/domain/hiring";
import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";
import { StoreError } from "@/lib/store/types";
import { text } from "@/lib/format";
import type { FormState } from "@/components/action-form";

export async function enrollStudent(_state: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireActor("/students/enroll");
  try {
    const grade = parseGrade(text(formData, "grade"));
    if (!grade) throw new StoreError("Choose grade 9, 10, 11, or 12.");
    const store = getStore();
    const current = await store.getActiveEnrollment(actor.id);
    const plan = planStudentEnrollment(current?.grade ?? null, grade);
    if (plan.unchanged) throw new StoreError("You are already enrolled in this grade.");
    await store.enrollStudent(actor.id, grade);
    redirect("/students/dashboard");
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
}
