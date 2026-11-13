import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { StatusPill } from "@/components/status-pill";
import { scheduleInterview, startAssessment } from "@/app/actions/hiring";
import { canTransition } from "@/domain/hiring";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Application" };

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActor("/admin/applications");
  const { id } = await params;
  const store = getStore();
  const application = await store.getApplication(id);
  if (!application) notFound();
  const interview = await store.getInterviewForApplication(application.id);
  const assessment = await store.getAssessmentForApplication(application.id);
  return (
    <>
      <p className="text-sm text-gray-700">{application.email}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl">{application.fullName}</h1>
        <StatusPill status={application.hiringStatus} />
      </div>
      <dl className="mt-6 grid max-w-2xl gap-3 text-[15px]">
        <div><dt className="text-gray-700">Phone</dt><dd>{application.phone}</dd></div>
        <div><dt className="text-gray-700">Education</dt><dd>{application.education}</dd></div>
        <div><dt className="text-gray-700">Experience</dt><dd className="max-w-prose">{application.experience}</dd></div>
        <div><dt className="text-gray-700">Requested grades</dt><dd>{application.requestedGrades.map((grade) => `Grade ${grade}`).join(", ")}</dd></div>
        <div><dt className="text-gray-700">Statement</dt><dd className="max-w-prose">{application.statement}</dd></div>
      </dl>

      {canTransition(application.hiringStatus, "interview_scheduled") ? (
        <section className="mt-10 max-w-xl">
          <h2 className="text-2xl">Schedule the interview</h2>
          <div className="mt-4">
            <ActionForm action={scheduleInterview} submitLabel="Schedule interview" pendingLabel="Scheduling…">
              <input type="hidden" name="applicationId" value={application.id} />
              <Field label="When" name="scheduledAt" type="datetime-local" required hint="Africa/Addis Ababa." />
              <Field label="Interviewer email" name="interviewerEmail" type="email" autoComplete="email" hint="Optional. Use the interviewer’s email if you have it." />
            </ActionForm>
          </div>
        </section>
      ) : null}

      {interview ? (
        <p className="mt-8">
          Interview {formatWhen(interview.scheduledAt)}.{" "}
          <Link href={`/admin/interviews/${interview.id}`} className="link">Open interview</Link>
        </p>
      ) : null}

      {canTransition(application.hiringStatus, "assessment_in_progress") ? (
        <form action={startAssessment} className="mt-6">
          <input type="hidden" name="applicationId" value={application.id} />
          <button className="btn btn-primary" type="submit">Start assessment</button>
        </form>
      ) : null}

      {assessment ? (
        <p className="mt-4">
          <Link href={`/admin/assessments/${application.id}`} className="link">Open assessment</Link>
        </p>
      ) : null}
    </>
  );
}
