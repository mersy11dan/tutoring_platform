import type { Grade } from "../../domain/grades";
import { hashPassword } from "../password";
import type { Database, StoredUser } from "./types";

export const DEMO_PASSWORD = "demo-password";

const studentId = "11111111-1111-4111-8111-111111111111";
const applicantId = "22222222-2222-4222-8222-222222222222";
const interviewUserId = "33333333-3333-4333-8333-333333333333";
const candidateId = "44444444-4444-4444-8444-444444444444";
const teacherId = "55555555-5555-4555-8555-555555555555";
const adminId = "66666666-6666-4666-8666-666666666666";

function user(id: string, email: string, fullName: string, accountType: StoredUser["accountType"], createdAt: string): StoredUser {
  const password = hashPassword(DEMO_PASSWORD);
  return {
    id,
    email,
    fullName,
    accountType,
    createdAt,
    passwordSalt: password.salt,
    passwordHash: password.hash,
  };
}

function daysFromNow(days: number, hours = 15): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hours - 3, 0, 0, 0);
  return date.toISOString();
}

export function createDatabase(now = new Date().toISOString()): Database {
  const createdAt = now;
  return {
    version: 1,
    users: [
      user(studentId, "student@example.com", "Demo Student", "student", createdAt),
      user(applicantId, "applicant@example.com", "Demo Applicant", "teacher", createdAt),
      user(interviewUserId, "interview@example.com", "Demo Interview", "teacher", createdAt),
      user(candidateId, "candidate@example.com", "Demo Candidate", "teacher", createdAt),
      user(teacherId, "teacher@example.com", "Demo Teacher", "teacher", createdAt),
      user(adminId, "studio.admin@example.com", "Demo Admin", "admin", createdAt),
    ],
    applications: [
      {
        id: "22222222-2222-4222-8222-222222222201",
        userId: applicantId,
        fullName: "Demo Applicant",
        email: "applicant@example.com",
        phone: "+251 000 000 002",
        education: "BEd Mathematics, sample university",
        experience: "Two years tutoring small groups.",
        requestedGrades: [9, 10],
        statement: "I want to teach the grades I have studied most carefully, starting with grade 9.",
        hiringStatus: "submitted",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "33333333-3333-4333-8333-333333333301",
        userId: interviewUserId,
        fullName: "Demo Interview",
        email: "interview@example.com",
        phone: "+251 000 000 003",
        education: "BSc Mathematics",
        experience: "Classroom teaching assistant.",
        requestedGrades: [9],
        statement: "Grade 9 is the year I most want to teach.",
        hiringStatus: "interview_scheduled",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "44444444-4444-4444-8444-444444444401",
        userId: candidateId,
        fullName: "Demo Candidate",
        email: "candidate@example.com",
        phone: "+251 000 000 004",
        education: "MSc Mathematics",
        experience: "Taught grades 9 through 12 in a school setting.",
        requestedGrades: [9, 10, 11, 12],
        statement: "I am applying to be assessed for every grade.",
        hiringStatus: "assessed",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "55555555-5555-4555-8555-555555555501",
        userId: teacherId,
        fullName: "Demo Teacher",
        email: "teacher@example.com",
        phone: "+251 000 000 005",
        education: "BEd Mathematics",
        experience: "Four years teaching grade 9 and grade 10.",
        requestedGrades: [9, 10],
        statement: "I teach the first two grades of high-school mathematics.",
        hiringStatus: "approved",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    interviews: [
      {
        id: "33333333-3333-4333-8333-333333333302",
        applicationId: "33333333-3333-4333-8333-333333333301",
        scheduledAt: daysFromNow(3, 18),
        interviewerEmail: "",
        notes: "",
        outcome: null,
        createdAt,
      },
    ],
    assessments: [
      {
        id: "44444444-4444-4444-8444-444444444402",
        applicationId: "44444444-4444-4444-8444-444444444401",
        scores: { 9: 92, 10: 88, 11: 86, 12: 74 },
        sampleLessonNotes: "Explained a grade 9 equation by working one example, then letting the student finish the next.",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "55555555-5555-4555-8555-555555555502",
        applicationId: "55555555-5555-4555-8555-555555555501",
        scores: { 9: 81, 10: 76 },
        sampleLessonNotes: "Clear worked example for linear equations.",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    approvals: [
      approval("55555555-5555-4555-8555-555555555511", teacherId, 9, true),
      approval("55555555-5555-4555-8555-555555555512", teacherId, 10, false),
    ],
    enrollments: [
      {
        id: "11111111-1111-4111-8111-111111111101",
        studentId,
        grade: 9 satisfies Grade,
        active: true,
        startedAt: createdAt,
        endedAt: null,
      },
    ],
    sessions: [
      {
        id: "55555555-5555-4555-8555-555555555521",
        grade: 9,
        teacherId,
        title: "Grade 9 equations",
        startsAt: daysFromNow(2, 16),
        endsAt: daysFromNow(2, 17),
        meetLink: "https://meet.google.com/demo-grade-nine",
        meetSource: "manual",
        status: "scheduled",
        createdBy: teacherId,
      },
    ],
    assignments: [
      {
        id: "55555555-5555-4555-8555-555555555531",
        grade: 9,
        teacherId,
        title: "Practice set 1",
        instructions: "Solve the eight linear equations from the lesson. Show each step.",
        dueAt: daysFromNow(6, 18),
        classroomCourseId: null,
        classroomCourseworkId: null,
        createdAt,
      },
    ],
  };
}

function approval(id: string, teacher: string, grade: Grade, optedIn: boolean): Database["approvals"][number] {
  return {
    id,
    teacherId: teacher,
    applicationId: "55555555-5555-4555-8555-555555555501",
    grade,
    allFour: false,
    source: "rule",
    reason: null,
    optedIn,
  };
}
