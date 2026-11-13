import { GRADES } from "@/domain/grades";
import { ActionForm } from "@/components/action-form";
import { enrollStudent } from "@/app/actions/student";
import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";

export const metadata = { title: "Enroll in a grade" };

export default async function EnrollPage() {
  const actor = await requireActor("/students/enroll");
  const current = await getStore().getActiveEnrollment(actor.id);
  return (
    <>
      <h1 className="text-4xl">Your grade</h1>
      <p className="mt-3 max-w-prose text-gray-700">
        Choose the grade you are in now. Enrolling in a different grade ends the previous one. You only see lessons and assignments for the active grade.
      </p>
      {current ? <p className="mt-4 text-brand-800">Currently Grade {current.grade}.</p> : null}
      <div className="mt-8 max-w-lg">
        <ActionForm action={enrollStudent} submitLabel="Enroll" pendingLabel="Enrolling…">
          <fieldset>
            <legend className="text-[15px] font-medium">Grade</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((grade) => (
                <label key={grade} className="flex min-h-16 flex-col justify-center border border-gray-200 bg-white px-3">
                  <span className="flex items-center gap-2">
                    <input type="radio" name="grade" value={grade} required defaultChecked={current?.grade === grade} className="size-4 accent-brand-700" />
                    <span className="font-display text-2xl text-brand-800">{grade}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </div>
    </>
  );
}
