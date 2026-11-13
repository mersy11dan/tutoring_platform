import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { ApprovalDecision, HiringStatus, InterviewOutcome } from "../../domain/hiring";
import { missingRequestedScores, outcomeToStatus, planStudentEnrollment, selectTeachingGrades, transitionError } from "../../domain/hiring";
import type { Grade } from "../../domain/grades";
import { verifyPassword } from "../password";
import { createDatabase } from "./seed";
import { StoreError, publicUser, type Application, type Approval, type Assessment, type Assignment, type ClassSession, type Database, type Enrollment, type Interview, type PublicUser } from "./types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class DemoStore {
  private db: Database;

  constructor(private readonly filePath: string, db?: Database) {
    this.db = db ?? { version: 1, users: [], applications: [], interviews: [], assessments: [], approvals: [], enrollments: [], sessions: [], assignments: [] };
  }

  static open(filePath: string): DemoStore {
    if (!existsSync(filePath)) {
      const store = new DemoStore(filePath, createDatabase());
      store.persist();
      return store;
    }
    const db = JSON.parse(readFileSync(filePath, "utf8")) as Database;
    return new DemoStore(filePath, db);
  }

  private persist() {
    mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    writeFileSync(temporary, JSON.stringify(this.db, null, 2));
    renameSync(temporary, this.filePath);
  }

  private userByEmail(email: string) {
    return this.db.users.find((user) => user.email === email.toLowerCase()) ?? null;
  }

  async getUser(id: string): Promise<PublicUser | null> {
    const user = this.db.users.find((item) => item.id === id);
    return user ? publicUser(user) : null;
  }

  async getUserByEmail(email: string): Promise<PublicUser | null> {
    const user = this.userByEmail(email);
    return user ? publicUser(user) : null;
  }

  async listUsers(): Promise<PublicUser[]> {
    return this.db.users.map(publicUser);
  }

  async authenticate(email: string, password: string): Promise<PublicUser | null> {
    const user = this.userByEmail(email);
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) return null;
    return publicUser(user);
  }

  async createStudent(input: { fullName: string; email: string; password: string }): Promise<PublicUser> {
    const email = input.email.toLowerCase();
    if (this.userByEmail(email)) throw new StoreError("An account with this email already exists.");
    const { hashPassword } = await import("../password");
    const password = hashPassword(input.password);
    const user = {
      id: crypto.randomUUID(),
      email,
      fullName: input.fullName.trim(),
      accountType: "student" as const,
      createdAt: new Date().toISOString(),
      passwordSalt: password.salt,
      passwordHash: password.hash,
    };
    this.db.users.push(user);
    this.persist();
    return publicUser(user);
  }

  async submitApplication(input: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    education: string;
    experience: string;
    requestedGrades: Grade[];
    statement: string;
  }): Promise<{ user: PublicUser; application: Application }> {
    const email = input.email.toLowerCase();
    if (this.userByEmail(email)) throw new StoreError("An account with this email already exists. Sign in to see the application.");
    const { hashPassword } = await import("../password");
    const password = hashPassword(input.password);
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      email,
      fullName: input.fullName.trim(),
      accountType: "teacher" as const,
      createdAt: now,
      passwordSalt: password.salt,
      passwordHash: password.hash,
    };
    const application: Application = {
      id: crypto.randomUUID(),
      userId: user.id,
      fullName: user.fullName,
      email,
      phone: input.phone.trim(),
      education: input.education.trim(),
      experience: input.experience.trim(),
      requestedGrades: input.requestedGrades,
      statement: input.statement.trim(),
      hiringStatus: "submitted",
      createdAt: now,
      updatedAt: now,
    };
    this.db.users.push(user);
    this.db.applications.push(application);
    this.persist();
    return { user: publicUser(user), application: clone(application) };
  }

  async listApplications(): Promise<Application[]> {
    return clone(this.db.applications).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getApplication(id: string): Promise<Application | null> {
    const application = this.db.applications.find((item) => item.id === id);
    return application ? clone(application) : null;
  }

  async getApplicationByUserId(userId: string): Promise<Application | null> {
    const application = this.db.applications.find((item) => item.userId === userId);
    return application ? clone(application) : null;
  }

  private requireApplication(id: string): Application {
    const application = this.db.applications.find((item) => item.id === id);
    if (!application) throw new StoreError("Application not found.");
    return application;
  }

  private move(application: Application, to: HiringStatus) {
    const message = transitionError(application.hiringStatus, to);
    if (message) throw new StoreError(message);
    application.hiringStatus = to;
    application.updatedAt = new Date().toISOString();
  }

  async scheduleInterview(input: { applicationId: string; scheduledAt: string; interviewerEmail: string }): Promise<Interview> {
    const application = this.requireApplication(input.applicationId);
    this.move(application, "interview_scheduled");
    const existing = this.db.interviews.find((item) => item.applicationId === application.id);
    const interview: Interview = existing ?? {
      id: crypto.randomUUID(),
      applicationId: application.id,
      scheduledAt: input.scheduledAt,
      interviewerEmail: input.interviewerEmail.trim().toLowerCase(),
      notes: "",
      outcome: null,
      createdAt: new Date().toISOString(),
    };
    interview.scheduledAt = input.scheduledAt;
    interview.interviewerEmail = input.interviewerEmail.trim().toLowerCase();
    interview.outcome = null;
    if (!existing) this.db.interviews.push(interview);
    this.persist();
    return clone(interview);
  }

  async recordInterview(input: { interviewId: string; notes: string; outcome: InterviewOutcome }): Promise<Interview> {
    const interview = this.db.interviews.find((item) => item.id === input.interviewId);
    if (!interview) throw new StoreError("Interview not found.");
    const application = this.requireApplication(interview.applicationId);
    this.move(application, outcomeToStatus(input.outcome));
    interview.notes = input.notes.trim();
    interview.outcome = input.outcome;
    this.persist();
    return clone(interview);
  }

  async listInterviews(): Promise<Interview[]> {
    return clone(this.db.interviews).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  async getInterview(id: string): Promise<Interview | null> {
    const interview = this.db.interviews.find((item) => item.id === id);
    return interview ? clone(interview) : null;
  }

  async getInterviewForApplication(applicationId: string): Promise<Interview | null> {
    const interview = this.db.interviews.find((item) => item.applicationId === applicationId);
    return interview ? clone(interview) : null;
  }

  async startAssessment(applicationId: string): Promise<Assessment> {
    const application = this.requireApplication(applicationId);
    this.move(application, "assessment_in_progress");
    const existing = this.db.assessments.find((item) => item.applicationId === applicationId);
    const assessment: Assessment = existing ?? {
      id: crypto.randomUUID(),
      applicationId,
      scores: {},
      sampleLessonNotes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!existing) this.db.assessments.push(assessment);
    this.persist();
    return clone(assessment);
  }

  async saveScores(input: { applicationId: string; scores: Assessment["scores"]; sampleLessonNotes: string }): Promise<Assessment> {
    const application = this.requireApplication(input.applicationId);
    if (application.hiringStatus !== "assessment_in_progress" && application.hiringStatus !== "assessed") {
      throw new StoreError("Scores can be saved once the assessment has started.");
    }
    const assessment = this.db.assessments.find((item) => item.applicationId === input.applicationId);
    if (!assessment) throw new StoreError("Assessment not found.");
    assessment.scores = input.scores;
    assessment.sampleLessonNotes = input.sampleLessonNotes.trim();
    assessment.updatedAt = new Date().toISOString();
    this.persist();
    return clone(assessment);
  }

  async markAssessed(applicationId: string): Promise<Application> {
    const application = this.requireApplication(applicationId);
    const assessment = this.db.assessments.find((item) => item.applicationId === applicationId);
    if (!assessment) throw new StoreError("Enter scores before marking the assessment complete.");
    const missing = missingRequestedScores(application.requestedGrades, assessment.scores);
    if (missing.length > 0) throw new StoreError(`Enter a score for ${missing.map((grade) => `grade ${grade}`).join(", ")}.`);
    this.move(application, "assessed");
    this.persist();
    return clone(application);
  }

  async getAssessmentForApplication(applicationId: string): Promise<Assessment | null> {
    const assessment = this.db.assessments.find((item) => item.applicationId === applicationId);
    return assessment ? clone(assessment) : null;
  }

  async listAssessments(): Promise<Assessment[]> {
    return clone(this.db.assessments);
  }

  async setHiringStatus(applicationId: string, status: HiringStatus): Promise<Application> {
    const application = this.requireApplication(applicationId);
    this.move(application, status);
    this.persist();
    return clone(application);
  }

  async approveApplication(applicationId: string, decision: ApprovalDecision): Promise<Application> {
    const application = this.requireApplication(applicationId);
    this.move(application, "approved");
    this.db.approvals = this.db.approvals.filter((item) => item.teacherId !== application.userId);
    for (const grade of decision.grades) {
      this.db.approvals.push({
        id: crypto.randomUUID(),
        teacherId: application.userId,
        applicationId: application.id,
        grade,
        allFour: decision.allFour,
        source: decision.source,
        reason: decision.reason,
        optedIn: false,
      });
    }
    this.persist();
    return clone(application);
  }

  async getApprovals(teacherId: string): Promise<Approval[]> {
    return clone(this.db.approvals.filter((item) => item.teacherId === teacherId)).sort((a, b) => a.grade - b.grade);
  }

  async listApprovals(): Promise<Approval[]> {
    return clone(this.db.approvals);
  }

  async setOptIn(teacherId: string, grades: Grade[]): Promise<Approval[]> {
    const approvals = this.db.approvals.filter((item) => item.teacherId === teacherId);
    const result = selectTeachingGrades(approvals.map((item) => item.grade), grades);
    if (!result.ok) throw new StoreError(result.error);
    for (const approval of approvals) approval.optedIn = result.grades.includes(approval.grade);
    this.persist();
    return this.getApprovals(teacherId);
  }

  async getActiveEnrollment(studentId: string): Promise<Enrollment | null> {
    const enrollment = this.db.enrollments.find((item) => item.studentId === studentId && item.active);
    return enrollment ? clone(enrollment) : null;
  }

  async enrollStudent(studentId: string, grade: Grade): Promise<Enrollment> {
    const current = this.db.enrollments.find((item) => item.studentId === studentId && item.active) ?? null;
    const plan = planStudentEnrollment(current?.grade ?? null, grade);
    if (plan.unchanged && current) return clone(current);
    const now = new Date().toISOString();
    if (current && plan.endGrade) {
      current.active = false;
      current.endedAt = now;
    }
    const enrollment: Enrollment = {
      id: crypto.randomUUID(),
      studentId,
      grade,
      active: true,
      startedAt: now,
      endedAt: null,
    };
    this.db.enrollments.push(enrollment);
    this.persist();
    return clone(enrollment);
  }

  async listEnrollments(): Promise<Enrollment[]> {
    return clone(this.db.enrollments);
  }

  async createSession(input: Omit<ClassSession, "id" | "status">): Promise<ClassSession> {
    const teaching = this.db.approvals.some((item) => item.teacherId === input.teacherId && item.grade === input.grade && item.optedIn);
    if (!teaching) throw new StoreError("That teacher has not opted in to this grade.");
    if (Date.parse(input.endsAt) <= Date.parse(input.startsAt)) throw new StoreError("The lesson must end after it starts.");
    const session: ClassSession = { ...input, id: crypto.randomUUID(), status: "scheduled" };
    this.db.sessions.push(session);
    this.persist();
    return clone(session);
  }

  async listSessions(filter?: { grade?: Grade; teacherId?: string; includeCancelled?: boolean }): Promise<ClassSession[]> {
    return clone(
      this.db.sessions
        .filter((session) => {
          if (filter?.grade && session.grade !== filter.grade) return false;
          if (filter?.teacherId && session.teacherId !== filter.teacherId) return false;
          if (!filter?.includeCancelled && session.status === "cancelled") return false;
          return true;
        })
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
  }

  async getSession(id: string): Promise<ClassSession | null> {
    const session = this.db.sessions.find((item) => item.id === id);
    return session ? clone(session) : null;
  }

  async setSessionStatus(id: string, status: ClassSession["status"]): Promise<ClassSession> {
    const session = this.db.sessions.find((item) => item.id === id);
    if (!session) throw new StoreError("Lesson not found.");
    session.status = status;
    this.persist();
    return clone(session);
  }

  async createAssignment(input: Omit<Assignment, "id" | "createdAt" | "classroomCourseId" | "classroomCourseworkId">): Promise<Assignment> {
    const teaching = this.db.approvals.some((item) => item.teacherId === input.teacherId && item.grade === input.grade && item.optedIn);
    if (!teaching) throw new StoreError("That teacher has not opted in to this grade.");
    const assignment: Assignment = {
      ...input,
      id: crypto.randomUUID(),
      classroomCourseId: null,
      classroomCourseworkId: null,
      createdAt: new Date().toISOString(),
    };
    this.db.assignments.push(assignment);
    this.persist();
    return clone(assignment);
  }

  async listAssignments(grade?: Grade): Promise<Assignment[]> {
    return clone(this.db.assignments.filter((item) => (grade ? item.grade === grade : true))).sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    const assignment = this.db.assignments.find((item) => item.id === id);
    return assignment ? clone(assignment) : null;
  }

  async attachClassroom(assignmentId: string, courseId: string, courseworkId: string): Promise<Assignment> {
    const assignment = this.db.assignments.find((item) => item.id === assignmentId);
    if (!assignment) throw new StoreError("Assignment not found.");
    assignment.classroomCourseId = courseId;
    assignment.classroomCourseworkId = courseworkId;
    this.persist();
    return clone(assignment);
  }
}

let singleton: DemoStore | null = null;

export function getDemoStore(): DemoStore {
  if (!singleton) {
    const filePath = process.env.TUTORING_STORE_PATH || path.join(process.cwd(), ".data", "store.json");
    singleton = DemoStore.open(filePath);
  }
  return singleton;
}
