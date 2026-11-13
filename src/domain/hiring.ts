import { GRADES, type Grade, uniqueGrades } from "./grades";

export const HIRING_STATUSES = [
  "submitted",
  "interview_scheduled",
  "interviewed",
  "assessment_in_progress",
  "assessed",
  "approved",
  "on_hold",
  "rejected",
] as const;

export type HiringStatus = (typeof HIRING_STATUSES)[number];

export const HIRING_LABELS: Record<HiringStatus, string> = {
  submitted: "Submitted",
  interview_scheduled: "Interview scheduled",
  interviewed: "Interviewed",
  assessment_in_progress: "Assessment in progress",
  assessed: "Assessed",
  approved: "Approved",
  on_hold: "On hold",
  rejected: "Rejected",
};

const TRANSITIONS: Record<HiringStatus, readonly HiringStatus[]> = {
  submitted: ["interview_scheduled"],
  interview_scheduled: ["interviewed", "on_hold", "rejected"],
  interviewed: ["assessment_in_progress", "on_hold", "rejected"],
  assessment_in_progress: ["assessed", "on_hold", "rejected"],
  assessed: ["approved", "on_hold", "rejected"],
  on_hold: ["interview_scheduled", "assessment_in_progress", "rejected"],
  approved: [],
  rejected: [],
};

export function isHiringStatus(value: string): value is HiringStatus {
  return (HIRING_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: HiringStatus, to: HiringStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transitionError(from: HiringStatus, to: HiringStatus): string | null {
  if (canTransition(from, to)) return null;
  return `Cannot move from ${HIRING_LABELS[from]} to ${HIRING_LABELS[to]}.`;
}

export type InterviewOutcome = "advance" | "hold" | "reject";

export function outcomeToStatus(outcome: InterviewOutcome): HiringStatus {
  if (outcome === "advance") return "interviewed";
  if (outcome === "hold") return "on_hold";
  return "rejected";
}

export function isInterviewOutcome(value: string): value is InterviewOutcome {
  return value === "advance" || value === "hold" || value === "reject";
}

export const PASSING_SCORE = 70;
export const STRONG_SCORE = 85;

export type GradeScores = Partial<Record<Grade, number>>;

export function scoreError(score: number): string | null {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return "Each score is a whole number from 0 to 100.";
  }
  return null;
}

export function eligibleGrades(scores: GradeScores): Grade[] {
  return GRADES.filter((grade) => {
    const score = scores[grade];
    return typeof score === "number" && score >= PASSING_SCORE && score <= 100;
  });
}

export function qualifiesForAllFour(scores: GradeScores): boolean {
  let strong = 0;
  for (const grade of GRADES) {
    const score = scores[grade];
    if (typeof score !== "number" || score < PASSING_SCORE || score > 100) return false;
    if (score >= STRONG_SCORE) strong += 1;
  }
  return strong >= 3;
}

export function missingRequestedScores(requested: readonly Grade[], scores: GradeScores): Grade[] {
  return uniqueGrades(requested).filter((grade) => {
    const score = scores[grade];
    return typeof score !== "number" || scoreError(score) !== null;
  });
}

export type ApprovalDecision = {
  grades: Grade[];
  allFour: boolean;
  source: "rule" | "override";
  reason: string | null;
};

export function decideApprovals(input: {
  scores: GradeScores;
  confirmEligible: boolean;
  confirmAllFour: boolean;
  overrideGrades?: readonly Grade[];
  overrideReason?: string;
}): { ok: true; decision: ApprovalDecision } | { ok: false; error: string } {
  if (input.overrideGrades) {
    const reason = input.overrideReason?.trim() ?? "";
    if (!reason) return { ok: false, error: "An override needs a written reason." };
    const grades = uniqueGrades(input.overrideGrades);
    if (grades.length === 0) {
      return { ok: false, error: "An override needs at least one grade." };
    }
    return {
      ok: true,
      decision: {
        grades,
        allFour: grades.length === GRADES.length,
        source: "override",
        reason,
      },
    };
  }

  if (input.confirmAllFour) {
    if (!qualifiesForAllFour(input.scores)) {
      return {
        ok: false,
        error:
          "All four grades need every grade at 70 or above and at least three grades at 85 or above.",
      };
    }
    return {
      ok: true,
      decision: { grades: [...GRADES], allFour: true, source: "rule", reason: null },
    };
  }

  if (!input.confirmEligible) {
    return { ok: false, error: "Confirm the eligible grades, or record an override with a reason." };
  }

  const grades = eligibleGrades(input.scores);
  if (grades.length === 0) {
    return {
      ok: false,
      error: "No grade scored 70 or above. Reject the application, or record an override with a reason.",
    };
  }

  return { ok: true, decision: { grades, allFour: false, source: "rule", reason: null } };
}

export function selectTeachingGrades(
  approved: readonly Grade[],
  requested: readonly Grade[],
): { ok: true; grades: Grade[] } | { ok: false; error: string } {
  const grades = uniqueGrades(requested);
  if (grades.length === 0) return { ok: false, error: "Choose at least one approved grade." };
  const allowed = new Set(uniqueGrades(approved));
  const denied = grades.filter((grade) => !allowed.has(grade));
  if (denied.length > 0) {
    return {
      ok: false,
      error: `Not approved to teach ${denied.map((grade) => `grade ${grade}`).join(", ")}.`,
    };
  }
  return { ok: true, grades };
}

export function planStudentEnrollment(
  current: Grade | null,
  next: Grade,
): { endGrade: Grade | null; startGrade: Grade; unchanged: boolean } {
  if (current === next) return { endGrade: null, startGrade: next, unchanged: true };
  return { endGrade: current, startGrade: next, unchanged: false };
}
