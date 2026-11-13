import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, PendingButton } from "@/components/action-form";
import { Area } from "@/components/fields";
import { recordInterview } from "@/app/actions/hiring";
import { canTransition, outcomeToStatus } from "@/domain/hiring";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Interview" };

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActor("/admin/interviews");
  const { id } = await params;
  const store = getStore();
  const interview = await store.getInterview(id);
  if (!interview) notFound();
  const application = await store.getApplication(interview.applicationId);
  if (!application) notFound();
  const canRecord = ["advance", "hold", "reject"].every((outcome) =>
    canTransition(application.hiringStatus, outcomeToStatus(outcome as "advance")),
  ) || canTransition(application.hiringStatus, "interviewed");
  return (
    <>
      <Crumbs items={[{ href: "/admin/interviews", label: "Interviews" }, { label: application.fullName }]} />
      <p className="text-sm text-gray-700 tabular-nums">{formatWhen(interview.scheduledAt)}</p>
      <h1 className="mt-2 text-4xl">{application.fullName}</h1>
      <p className="mt-3 text-gray-700">
        Interviewer: {interview.interviewerEmail || "Not named yet"}.{" "}
        <Link href={`/admin/applications/${application.id}`} className="link">Application</Link>
      </p>
      {interview.outcome ? <p className="mt-4">Recorded outcome: {interview.outcome}.</p> : null}
      {interview.notes ? <p className="mt-2 max-w-prose">{interview.notes}</p> : null}
      {canRecord && !interview.outcome ? (
        <div className="mt-8 max-w-xl">
          <ActionForm action={recordInterview}>
            <input type="hidden" name="interviewId" value={interview.id} />
            <Area label="Notes" name="notes" hint="What you want the next admin to know." />
            <div className="flex flex-wrap gap-2">
              <PendingButton name="outcome" value="advance" pendingLabel="Saving…">Advance to assessment</PendingButton>
              <PendingButton name="outcome" value="hold" className="btn btn-secondary" pendingLabel="Saving…">Hold</PendingButton>
              <PendingButton name="outcome" value="reject" className="btn btn-secondary" pendingLabel="Saving…">Reject</PendingButton>
            </div>
          </ActionForm>
        </div>
      ) : null}
    </>
  );
}
