import { ActionForm } from "@/components/action-form";
import { Area, Field } from "@/components/fields";
import { createAssignment } from "@/app/actions/teaching";
import { GOOGLE_NOT_CONNECTED, googleConnection, readGoogleEnv } from "@/lib/google";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Assignments" };

export default async function TeacherAssignmentsPage() {
  const actor = await requireActor("/teachers/assignments");
  const store = getStore();
  const approvals = (await store.getApprovals(actor.id)).filter((item) => item.optedIn);
  const assignments = (await store.listAssignments()).filter((item) => item.teacherId === actor.id);
  const google = googleConnection(readGoogleEnv());
  return (
    <>
      <h1 className="text-4xl">Assignments</h1>
      <p className="mt-3 max-w-prose text-gray-700">Assignments are saved here. Google Classroom is optional.</p>
      {!google.connected ? <p className="mt-3 text-sm text-warning-800">{GOOGLE_NOT_CONNECTED}</p> : null}
      <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="py-4">
            <p className="text-lg">{assignment.title}</p>
            <p className="text-sm text-gray-700 tabular-nums">
              Grade {assignment.grade}
              {assignment.dueAt ? `, due ${formatWhen(assignment.dueAt)}` : ""}
              {assignment.classroomCourseworkId ? ", Classroom linked" : ", local only"}
            </p>
          </li>
        ))}
        {assignments.length === 0 ? <li className="py-4 text-gray-700">No assignments yet.</li> : null}
      </ul>
      {approvals.length > 0 ? (
        <div className="mt-10 max-w-xl">
          <h2 className="text-2xl">New assignment</h2>
          <div className="mt-4">
            <ActionForm action={createAssignment} submitLabel="Save assignment" pendingLabel="Saving…">
              <Field label="Title" name="title" required />
              <div className="grid gap-1.5">
                <label htmlFor="grade" className="text-[15px] font-medium">Grade</label>
                <select id="grade" name="grade" className="select" required defaultValue={String(approvals[0]?.grade ?? "")}>
                  {approvals.map((approval) => (
                    <option key={approval.grade} value={approval.grade}>Grade {approval.grade}</option>
                  ))}
                </select>
              </div>
              <Area label="Instructions" name="instructions" />
              <Field label="Due" name="dueAt" type="datetime-local" hint="Optional. Africa/Addis Ababa." />
              <label className="flex items-start gap-3 text-[15px]">
                <input type="checkbox" name="classroom" value="yes" disabled={!google.connected} className="mt-1 size-4 accent-brand-700" />
                <span>Also create this in Google Classroom {google.connected ? "" : "(unavailable)"}</span>
              </label>
              {google.connected ? <Field label="Existing course id" name="courseId" hint="Leave blank to create a course for this grade." /> : null}
            </ActionForm>
          </div>
        </div>
      ) : null}
    </>
  );
}
