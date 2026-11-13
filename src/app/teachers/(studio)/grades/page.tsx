import { ActionForm } from "@/components/action-form";
import { saveTeachingGrades } from "@/app/actions/teaching";
import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";

export const metadata = { title: "Grades you teach" };

export default async function TeacherGradesPage() {
  const actor = await requireActor("/teachers/grades");
  const approvals = await getStore().getApprovals(actor.id);
  return (
    <>
      <h1 className="text-4xl">Grades you teach</h1>
      <p className="mt-3 max-w-prose text-gray-700">
        A grade appears here only after an admin approves it. All four grades are listed together when an admin confirmed the strong-teacher rule, or recorded an override.
      </p>
      {approvals.length === 0 ? (
        <p className="mt-6 text-gray-700">No grades are approved on this account yet.</p>
      ) : (
        <div className="mt-8 max-w-xl">
          <ActionForm action={saveTeachingGrades} submitLabel="Save grades" pendingLabel="Saving…">
            <fieldset>
              <legend className="text-[15px] font-medium">Opt in</legend>
              <div className="mt-2 grid gap-2">
                {approvals.map((approval) => (
                  <label key={approval.id} className="flex items-start gap-3 border border-gray-200 bg-white px-3 py-3">
                    <input type="checkbox" name="grades" value={approval.grade} defaultChecked={approval.optedIn} className="mt-1 size-4 accent-brand-700" />
                    <span>
                      <span className="block">Grade {approval.grade}</span>
                      <span className="block text-sm text-gray-700">
                        {approval.allFour ? "Part of an all-four approval. " : ""}
                        {approval.source === "override" ? `Override: ${approval.reason}` : "Score rule, confirmed by an admin."}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </ActionForm>
        </div>
      )}
    </>
  );
}
