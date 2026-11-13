import { notFound } from "next/navigation";
import { GRADES } from "@/domain/grades";
import { qualifiesForAllFour } from "@/domain/hiring";
import { ActionForm, PendingButton } from "@/components/action-form";
import { Area, Check, GradeChecks } from "@/components/fields";
import { saveAssessment } from "@/app/actions/hiring";
import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";
import { Crumbs } from "@/components/crumbs";

export const metadata = { title: "Assessment" };

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActor("/admin/assessments");
  const { id } = await params;
  const store = getStore();
  const application = await store.getApplication(id);
  if (!application) notFound();
  const assessment = await store.getAssessmentForApplication(id);
  if (!assessment) notFound();
  const strong = qualifiesForAllFour(assessment.scores);
  const editable = application.hiringStatus === "assessment_in_progress" || application.hiringStatus === "assessed";
  return (
    <>
      <Crumbs items={[{ href: "/admin/assessments", label: "Assessments" }, { label: application.fullName }]} />
      <h1 className="text-4xl">{application.fullName}</h1>
      <p className="mt-3 max-w-prose text-gray-700">
        Score each requested grade from 0 to 100. A grade is eligible at 70. All four grades need every score at 70 or above and at least three at 85, then your confirmation.
      </p>
      <p className="mt-2 text-sm text-gray-700">
        Requested: {application.requestedGrades.map((grade) => `Grade ${grade}`).join(", ")}.
        {strong ? " The strong-teacher rule currently passes." : " The strong-teacher rule does not pass yet."}
      </p>
      {editable ? (
        <div className="mt-8 max-w-xl">
          <ActionForm action={saveAssessment}>
            <input type="hidden" name="applicationId" value={application.id} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {GRADES.map((grade) => (
                <div key={grade} className="grid gap-1.5">
                  <label htmlFor={`score_${grade}`} className="text-[15px] font-medium">
                    Grade {grade}
                  </label>
                  <input
                    id={`score_${grade}`}
                    name={`score_${grade}`}
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    className="field tabular-nums"
                    defaultValue={assessment.scores[grade] ?? ""}
                  />
                </div>
              ))}
            </div>
            <Area label="Sample lesson notes" name="sampleLessonNotes" defaultValue={assessment.sampleLessonNotes} hint="Optional." />
            {application.hiringStatus === "assessment_in_progress" ? (
              <div className="flex flex-wrap gap-2">
                <PendingButton name="intent" value="save" className="btn btn-secondary" pendingLabel="Saving…">Save scores</PendingButton>
                <PendingButton name="intent" value="assessed" pendingLabel="Saving…">Mark assessed</PendingButton>
              </div>
            ) : null}
            {application.hiringStatus === "assessed" ? (
              <>
                <Check name="confirmEligible" label="Confirm the grades that scored 70 or above." />
                <Check name="confirmAllFour" label="Confirm this teacher may teach all four grades." />
                <Check name="useOverride" label="Override the score rule. A written reason is required." />
                <GradeChecks legend="Override grades" name="overrideGrade" />
                <Area label="Override reason" name="overrideReason" hint="Required only when you override." />
                <div className="flex flex-wrap gap-2">
                  <PendingButton name="intent" value="approve" pendingLabel="Saving…">Approve</PendingButton>
                  <PendingButton name="intent" value="hold" className="btn btn-secondary" pendingLabel="Saving…">Hold</PendingButton>
                  <PendingButton name="intent" value="reject" className="btn btn-secondary" pendingLabel="Saving…">Reject</PendingButton>
                </div>
              </>
            ) : null}
          </ActionForm>
        </div>
      ) : (
        <p className="mt-6 text-gray-700">This assessment is not open for scoring. Status: {application.hiringStatus}.</p>
      )}
    </>
  );
}
