import type { AccountType } from "../../domain/access";
import type { Grade } from "../../domain/grades";
import type { GradeScores, HiringStatus, InterviewOutcome } from "../../domain/hiring";

export type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  createdAt: string;
};

export type StoredUser = PublicUser & {
  passwordSalt: string;
  passwordHash: string;
};

export type Application = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  requestedGrades: Grade[];
  statement: string;
  hiringStatus: HiringStatus;
  createdAt: string;
  updatedAt: string;
};

export type Interview = {
  id: string;
  applicationId: string;
  scheduledAt: string;
  interviewerEmail: string;
  notes: string;
  outcome: InterviewOutcome | null;
  createdAt: string;
};

export type Assessment = {
  id: string;
  applicationId: string;
  scores: GradeScores;
  sampleLessonNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type Approval = {
  id: string;
  teacherId: string;
  applicationId: string;
  grade: Grade;
  allFour: boolean;
  source: "rule" | "override";
  reason: string | null;
  optedIn: boolean;
};

export type Enrollment = {
  id: string;
  studentId: string;
  grade: Grade;
  active: boolean;
  startedAt: string;
  endedAt: string | null;
};

export type ClassSession = {
  id: string;
  grade: Grade;
  teacherId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  meetLink: string | null;
  meetSource: "manual" | "google";
  status: "scheduled" | "cancelled" | "completed";
  createdBy: string;
};

export type Assignment = {
  id: string;
  grade: Grade;
  teacherId: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  classroomCourseId: string | null;
  classroomCourseworkId: string | null;
  createdAt: string;
};

export type Database = {
  version: 1;
  users: StoredUser[];
  applications: Application[];
  interviews: Interview[];
  assessments: Assessment[];
  approvals: Approval[];
  enrollments: Enrollment[];
  sessions: ClassSession[];
  assignments: Assignment[];
};

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreError";
  }
}

export function publicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    accountType: user.accountType,
    createdAt: user.createdAt,
  };
}
