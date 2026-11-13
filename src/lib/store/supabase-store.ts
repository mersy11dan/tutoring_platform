import { parseGrade, type Grade } from "../../domain/grades";
import {
  missingRequestedScores,
  outcomeToStatus,
  planStudentEnrollment,
  selectTeachingGrades,
  transitionError,
  type ApprovalDecision,
  type GradeScores,
  type HiringStatus,
  type InterviewOutcome,
} from "../../domain/hiring";
import { adminEmails } from "../env";
import { createServiceClient } from "../supabase/service";
import { StoreError, type Application, type Approval, type Assessment, type Assignment, type ClassSession, type Enrollment, type Interview, type PublicUser } from "./types";

type Row = Record<string, unknown>;

function scoresFrom(value: unknown): GradeScores {
  const scores: GradeScores = {};
  if (!value || typeof value !== "object") return scores;
  for (const [key, score] of Object.entries(value)) {
    const grade = parseGrade(key);
    if (grade && typeof score === "number") scores[grade] = score;
  }
  return scores;
}

function scoresTo(scores: GradeScores): Record<string, number> {
  return Object.fromEntries(Object.entries(scores).filter((entry) => typeof entry[1] === "number"));
}

function userFrom(row: Row): PublicUser {
  return {
    id: String(row.id),
    email: String(row.email),
    fullName: String(row.full_name),
    accountType: row.account_type as PublicUser["accountType"],
    createdAt: String(row.created_at),
  };
}

function applicationFrom(row: Row): Application {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone),
    education: String(row.education),
    experience: String(row.experience),
    requestedGrades: (row.requested_grades as number[]).map((grade) => parseGrade(grade)).filter((grade): grade is Grade => grade !== null),
    statement: String(row.statement),
    hiringStatus: row.hiring_status as HiringStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function interviewFrom(row: Row): Interview {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    scheduledAt: String(row.scheduled_at),
    interviewerEmail: String(row.interviewer_email ?? ""),
    notes: String(row.notes ?? ""),
    outcome: (row.outcome as InterviewOutcome | null) ?? null,
    createdAt: String(row.created_at),
  };
}

function assessmentFrom(row: Row): Assessment {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    scores: scoresFrom(row.scores),
    sampleLessonNotes: String(row.sample_lesson_notes ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function approvalFrom(row: Row): Approval {
  return {
    id: String(row.id),
    teacherId: String(row.teacher_id),
    applicationId: String(row.application_id),
    grade: parseGrade(row.grade) ?? 9,
    allFour: Boolean(row.all_four),
    source: row.source as Approval["source"],
    reason: row.reason ? String(row.reason) : null,
    optedIn: Boolean(row.opted_in),
  };
}

function enrollmentFrom(row: Row): Enrollment {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    grade: parseGrade(row.grade) ?? 9,
    active: Boolean(row.active),
    startedAt: String(row.started_at),
    endedAt: row.ended_at ? String(row.ended_at) : null,
  };
}

function sessionFrom(row: Row): ClassSession {
  return {
    id: String(row.id),
    grade: parseGrade(row.grade) ?? 9,
    teacherId: String(row.teacher_id),
    title: String(row.title),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    meetLink: row.meet_link ? String(row.meet_link) : null,
    meetSource: row.meet_source as ClassSession["meetSource"],
    status: row.status as ClassSession["status"],
    createdBy: String(row.created_by),
  };
}

function assignmentFrom(row: Row): Assignment {
  return {
    id: String(row.id),
    grade: parseGrade(row.grade) ?? 9,
    teacherId: String(row.teacher_id),
    title: String(row.title),
    instructions: String(row.instructions ?? ""),
    dueAt: row.due_at ? String(row.due_at) : null,
    classroomCourseId: row.classroom_course_id ? String(row.classroom_course_id) : null,
    classroomCourseworkId: row.classroom_coursework_id ? String(row.classroom_coursework_id) : null,
    createdAt: String(row.created_at),
  };
}

export class SupabaseStore {
  private db() {
    return createServiceClient();
  }

  private fail(error: { message: string } | null, fallback: string): asserts error is null {
    if (error) throw new StoreError(error.message || fallback);
  }

  private async syncMetadata(userId: string) {
    const user = await this.getUser(userId);
    if (!user) return;
    const application = await this.getApplicationByUserId(userId);
    const { error } = await this.db().auth.admin.updateUserById(userId, {
      app_metadata: {
        account_type: user.accountType,
        hiring_status: application?.hiringStatus ?? null,
        role: adminEmails().includes(user.email) ? "admin" : null,
      },
    });
    if (error) throw new StoreError("Could not update account access.");
  }

  private async createAuthUser(input: { fullName: string; email: string; password: string; accountType: PublicUser["accountType"] }) {
    const email = input.email.toLowerCase();
    const existing = await this.getUserByEmail(email);
    if (existing) throw new StoreError("An account with this email already exists.");
    const admin = this.db();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName.trim() },
      app_metadata: {
        account_type: input.accountType,
        hiring_status: null,
        role: adminEmails().includes(email) ? "admin" : null,
      },
    });
    if (error || !data.user) throw new StoreError(error?.message || "Could not create the account.");
    const { error: profileError } = await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: input.fullName.trim(),
      account_type: input.accountType,
    });
    this.fail(profileError, "Could not save the profile.");
    const user = await this.getUser(data.user.id);
    if (!user) throw new StoreError("Could not save the profile.");
    return user;
  }

  async getUser(id: string): Promise<PublicUser | null> {
    const { data, error } = await this.db().from("profiles").select("*").eq("id", id).maybeSingle();
    this.fail(error, "Could not load the profile.");
    return data ? userFrom(data) : null;
  }

  async getUserByEmail(email: string): Promise<PublicUser | null> {
    const { data, error } = await this.db().from("profiles").select("*").eq("email", email.toLowerCase()).maybeSingle();
    this.fail(error, "Could not load the profile.");
    return data ? userFrom(data) : null;
  }

  async listUsers(): Promise<PublicUser[]> {
    const { data, error } = await this.db().from("profiles").select("*").order("full_name");
    this.fail(error, "Could not load profiles.");
    return (data ?? []).map(userFrom);
  }

  async createStudent(input: { fullName: string; email: string; password: string }) {
    return this.createAuthUser({ ...input, accountType: "student" });
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
  }) {
    const user = await this.createAuthUser({ ...input, accountType: "teacher" });
    const { data, error } = await this.db()
      .from("teacher_applications")
      .insert({
        user_id: user.id,
        full_name: input.fullName.trim(),
        email: input.email.toLowerCase(),
        phone: input.phone.trim(),
        education: input.education.trim(),
        experience: input.experience.trim(),
        requested_grades: input.requestedGrades,
        statement: input.statement.trim(),
        hiring_status: "submitted",
      })
      .select("*")
      .single();
    this.fail(error, "Could not save the application.");
    await this.syncMetadata(user.id);
    return { user, application: applicationFrom(data) };
  }

  async listApplications(): Promise<Application[]> {
    const { data, error } = await this.db().from("teacher_applications").select("*").order("created_at", { ascending: false });
    this.fail(error, "Could not load applications.");
    return (data ?? []).map(applicationFrom);
  }

  async getApplication(id: string): Promise<Application | null> {
    const { data, error } = await this.db().from("teacher_applications").select("*").eq("id", id).maybeSingle();
    this.fail(error, "Could not load the application.");
    return data ? applicationFrom(data) : null;
  }

  async getApplicationByUserId(userId: string): Promise<Application | null> {
    const { data, error } = await this.db().from("teacher_applications").select("*").eq("user_id", userId).maybeSingle();
    this.fail(error, "Could not load the application.");
    return data ? applicationFrom(data) : null;
  }

  private async requireApplication(id: string): Promise<Application> {
    const application = await this.getApplication(id);
    if (!application) throw new StoreError("Application not found.");
    return application;
  }

  private async move(application: Application, status: HiringStatus) {
    const message = transitionError(application.hiringStatus, status);
    if (message) throw new StoreError(message);
    const { error } = await this.db()
      .from("teacher_applications")
      .update({ hiring_status: status, updated_at: new Date().toISOString() })
      .eq("id", application.id);
    this.fail(error, "Could not update the application.");
    await this.syncMetadata(application.userId);
  }

  async scheduleInterview(input: { applicationId: string; scheduledAt: string; interviewerEmail: string }): Promise<Interview> {
    const application = await this.requireApplication(input.applicationId);
    const existing = await this.getInterviewForApplication(application.id);
    await this.move(application, "interview_scheduled");
    const payload = {
      application_id: application.id,
      scheduled_at: input.scheduledAt,
      interviewer_email: input.interviewerEmail.trim().toLowerCase(),
      outcome: null,
    };
    const query = existing
      ? this.db().from("interviews").update(payload).eq("id", existing.id).select("*").single()
      : this.db().from("interviews").insert({ ...payload, notes: "" }).select("*").single();
    const { data, error } = await query;
    this.fail(error, "Could not schedule the interview.");
    return interviewFrom(data);
  }

  async recordInterview(input: { interviewId: string; notes: string; outcome: InterviewOutcome }): Promise<Interview> {
    const interview = await this.getInterview(input.interviewId);
    if (!interview) throw new StoreError("Interview not found.");
    const application = await this.requireApplication(interview.applicationId);
    await this.move(application, outcomeToStatus(input.outcome));
    const { data, error } = await this.db()
      .from("interviews")
      .update({ notes: input.notes.trim(), outcome: input.outcome })
      .eq("id", interview.id)
      .select("*")
      .single();
    this.fail(error, "Could not save the interview.");
    return interviewFrom(data);
  }

  async listInterviews(): Promise<Interview[]> {
    const { data, error } = await this.db().from("interviews").select("*").order("scheduled_at");
    this.fail(error, "Could not load interviews.");
    return (data ?? []).map(interviewFrom);
  }

  async getInterview(id: string): Promise<Interview | null> {
    const { data, error } = await this.db().from("interviews").select("*").eq("id", id).maybeSingle();
    this.fail(error, "Could not load the interview.");
    return data ? interviewFrom(data) : null;
  }

  async getInterviewForApplication(applicationId: string): Promise<Interview | null> {
    const { data, error } = await this.db().from("interviews").select("*").eq("application_id", applicationId).maybeSingle();
    this.fail(error, "Could not load the interview.");
    return data ? interviewFrom(data) : null;
  }

  async startAssessment(applicationId: string): Promise<Assessment> {
    const application = await this.requireApplication(applicationId);
    await this.move(application, "assessment_in_progress");
    const existing = await this.getAssessmentForApplication(applicationId);
    if (existing) return existing;
    const { data, error } = await this.db()
      .from("assessments")
      .insert({ application_id: applicationId, scores: {}, sample_lesson_notes: "" })
      .select("*")
      .single();
    this.fail(error, "Could not start the assessment.");
    return assessmentFrom(data);
  }

  async saveScores(input: { applicationId: string; scores: GradeScores; sampleLessonNotes: string }): Promise<Assessment> {
    const application = await this.requireApplication(input.applicationId);
    if (application.hiringStatus !== "assessment_in_progress" && application.hiringStatus !== "assessed") {
      throw new StoreError("Scores can be saved once the assessment has started.");
    }
    const { data, error } = await this.db()
      .from("assessments")
      .update({ scores: scoresTo(input.scores), sample_lesson_notes: input.sampleLessonNotes.trim(), updated_at: new Date().toISOString() })
      .eq("application_id", input.applicationId)
      .select("*")
      .single();
    this.fail(error, "Could not save the scores.");
    return assessmentFrom(data);
  }

  async markAssessed(applicationId: string): Promise<Application> {
    const application = await this.requireApplication(applicationId);
    const assessment = await this.getAssessmentForApplication(applicationId);
    if (!assessment) throw new StoreError("Enter scores before marking the assessment complete.");
    const missing = missingRequestedScores(application.requestedGrades, assessment.scores);
    if (missing.length > 0) throw new StoreError(`Enter a score for ${missing.map((grade) => `grade ${grade}`).join(", ")}.`);
    await this.move(application, "assessed");
    const updated = await this.getApplication(applicationId);
    if (!updated) throw new StoreError("Application not found.");
    return updated;
  }

  async getAssessmentForApplication(applicationId: string): Promise<Assessment | null> {
    const { data, error } = await this.db().from("assessments").select("*").eq("application_id", applicationId).maybeSingle();
    this.fail(error, "Could not load the assessment.");
    return data ? assessmentFrom(data) : null;
  }

  async listAssessments(): Promise<Assessment[]> {
    const { data, error } = await this.db().from("assessments").select("*");
    this.fail(error, "Could not load assessments.");
    return (data ?? []).map(assessmentFrom);
  }

  async setHiringStatus(applicationId: string, status: HiringStatus): Promise<Application> {
    const application = await this.requireApplication(applicationId);
    await this.move(application, status);
    const updated = await this.getApplication(applicationId);
    if (!updated) throw new StoreError("Application not found.");
    return updated;
  }

  async approveApplication(applicationId: string, decision: ApprovalDecision): Promise<Application> {
    const application = await this.requireApplication(applicationId);
    await this.move(application, "approved");
    const { error: deleteError } = await this.db().from("teacher_grade_approvals").delete().eq("teacher_id", application.userId);
    this.fail(deleteError, "Could not update grade approvals.");
    if (decision.grades.length > 0) {
      const { error } = await this.db().from("teacher_grade_approvals").insert(
        decision.grades.map((grade) => ({
          teacher_id: application.userId,
          application_id: application.id,
          grade,
          all_four: decision.allFour,
          source: decision.source,
          reason: decision.reason,
          opted_in: false,
        })),
      );
      this.fail(error, "Could not save grade approvals.");
    }
    const updated = await this.getApplication(applicationId);
    if (!updated) throw new StoreError("Application not found.");
    return updated;
  }

  async getApprovals(teacherId: string): Promise<Approval[]> {
    const { data, error } = await this.db().from("teacher_grade_approvals").select("*").eq("teacher_id", teacherId).order("grade");
    this.fail(error, "Could not load approvals.");
    return (data ?? []).map(approvalFrom);
  }

  async listApprovals(): Promise<Approval[]> {
    const { data, error } = await this.db().from("teacher_grade_approvals").select("*").order("grade");
    this.fail(error, "Could not load approvals.");
    return (data ?? []).map(approvalFrom);
  }

  async setOptIn(teacherId: string, grades: Grade[]): Promise<Approval[]> {
    const approvals = await this.getApprovals(teacherId);
    const result = selectTeachingGrades(approvals.map((item) => item.grade), grades);
    if (!result.ok) throw new StoreError(result.error);
    for (const approval of approvals) {
      const { error } = await this.db()
        .from("teacher_grade_approvals")
        .update({ opted_in: result.grades.includes(approval.grade) })
        .eq("id", approval.id);
      this.fail(error, "Could not save the grades you teach.");
    }
    return this.getApprovals(teacherId);
  }

  async getActiveEnrollment(studentId: string): Promise<Enrollment | null> {
    const { data, error } = await this.db().from("student_enrollments").select("*").eq("student_id", studentId).eq("active", true).maybeSingle();
    this.fail(error, "Could not load enrollment.");
    return data ? enrollmentFrom(data) : null;
  }

  async enrollStudent(studentId: string, grade: Grade): Promise<Enrollment> {
    const current = await this.getActiveEnrollment(studentId);
    const plan = planStudentEnrollment(current?.grade ?? null, grade);
    if (plan.unchanged && current) return current;
    const now = new Date().toISOString();
    if (current) {
      const { error } = await this.db().from("student_enrollments").update({ active: false, ended_at: now }).eq("id", current.id);
      this.fail(error, "Could not update enrollment.");
    }
    const { data, error } = await this.db()
      .from("student_enrollments")
      .insert({ student_id: studentId, grade, active: true, started_at: now })
      .select("*")
      .single();
    this.fail(error, "Could not save enrollment.");
    return enrollmentFrom(data);
  }

  async listEnrollments(): Promise<Enrollment[]> {
    const { data, error } = await this.db().from("student_enrollments").select("*");
    this.fail(error, "Could not load enrollments.");
    return (data ?? []).map(enrollmentFrom);
  }

  private async assertTeaching(teacherId: string, grade: Grade) {
    const approvals = await this.getApprovals(teacherId);
    if (!approvals.some((item) => item.grade === grade && item.optedIn)) {
      throw new StoreError("That teacher has not opted in to this grade.");
    }
  }

  async createSession(input: Omit<ClassSession, "id" | "status">): Promise<ClassSession> {
    await this.assertTeaching(input.teacherId, input.grade);
    if (Date.parse(input.endsAt) <= Date.parse(input.startsAt)) throw new StoreError("The lesson must end after it starts.");
    const { data, error } = await this.db()
      .from("sessions")
      .insert({
        grade: input.grade,
        teacher_id: input.teacherId,
        title: input.title,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        meet_link: input.meetLink,
        meet_source: input.meetSource,
        status: "scheduled",
        created_by: input.createdBy,
      })
      .select("*")
      .single();
    this.fail(error, "Could not schedule the lesson.");
    return sessionFrom(data);
  }

  async listSessions(filter?: { grade?: Grade; teacherId?: string; includeCancelled?: boolean }): Promise<ClassSession[]> {
    let query = this.db().from("sessions").select("*").order("starts_at");
    if (filter?.grade) query = query.eq("grade", filter.grade);
    if (filter?.teacherId) query = query.eq("teacher_id", filter.teacherId);
    if (!filter?.includeCancelled) query = query.neq("status", "cancelled");
    const { data, error } = await query;
    this.fail(error, "Could not load lessons.");
    return (data ?? []).map(sessionFrom);
  }

  async getSession(id: string): Promise<ClassSession | null> {
    const { data, error } = await this.db().from("sessions").select("*").eq("id", id).maybeSingle();
    this.fail(error, "Could not load the lesson.");
    return data ? sessionFrom(data) : null;
  }

  async setSessionStatus(id: string, status: ClassSession["status"]): Promise<ClassSession> {
    const { data, error } = await this.db().from("sessions").update({ status }).eq("id", id).select("*").single();
    this.fail(error, "Could not update the lesson.");
    return sessionFrom(data);
  }

  async createAssignment(input: Omit<Assignment, "id" | "createdAt" | "classroomCourseId" | "classroomCourseworkId">): Promise<Assignment> {
    await this.assertTeaching(input.teacherId, input.grade);
    const { data, error } = await this.db()
      .from("assignments")
      .insert({
        grade: input.grade,
        teacher_id: input.teacherId,
        title: input.title,
        instructions: input.instructions,
        due_at: input.dueAt,
      })
      .select("*")
      .single();
    this.fail(error, "Could not save the assignment.");
    return assignmentFrom(data);
  }

  async listAssignments(grade?: Grade): Promise<Assignment[]> {
    let query = this.db().from("assignments").select("*").order("due_at");
    if (grade) query = query.eq("grade", grade);
    const { data, error } = await query;
    this.fail(error, "Could not load assignments.");
    return (data ?? []).map(assignmentFrom);
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    const { data, error } = await this.db().from("assignments").select("*").eq("id", id).maybeSingle();
    this.fail(error, "Could not load the assignment.");
    return data ? assignmentFrom(data) : null;
  }

  async attachClassroom(assignmentId: string, courseId: string, courseworkId: string): Promise<Assignment> {
    const { data, error } = await this.db()
      .from("assignments")
      .update({ classroom_course_id: courseId, classroom_coursework_id: courseworkId })
      .eq("id", assignmentId)
      .select("*")
      .single();
    this.fail(error, "Could not save the Classroom ids.");
    return assignmentFrom(data);
  }
}
