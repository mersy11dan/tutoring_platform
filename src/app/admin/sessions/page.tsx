import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { cancelLesson, createLesson } from "@/app/actions/teaching";
import { GRADES } from "@/domain/grades";
import { GOOGLE_NOT_CONNECTED, googleConnection, readGoogleEnv } from "@/lib/google";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Lessons" };

export default async function AdminSessionsPage() {
  await requireActor("/admin/sessions");
  const store = getStore();
  const sessions = await store.listSessions({ includeCancelled: true });
  const users = await store.listUsers();
  const approvals = await store.listApprovals();
  const teachers = users.filter((user) => approvals.some((item) => item.teacherId === user.id && item.optedIn));
  const google = googleConnection(readGoogleEnv());
  return (
    <>
      <h1 className="text-4xl">Lessons</h1>
      {!google.connected ? <p className="mt-3 text-sm text-warning-800">{GOOGLE_NOT_CONNECTED}</p> : null}
      <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {sessions.map((session) => {
          const teacher = users.find((user) => user.id === session.teacherId);
          return (
            <li key={session.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-lg">{session.title}</p>
                <p className="text-sm text-gray-700 tabular-nums">
                  Grade {session.grade}, {teacher?.fullName ?? "Teacher"}, {formatWhen(session.startsAt)}, {session.status}
                </p>
              </div>
              {session.status === "scheduled" ? (
                <form action={cancelLesson} className="flex items-center gap-3">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="confirm" value="yes" required className="size-4 accent-brand-700" />
                    Cancel
                  </label>
                  <button className="btn btn-secondary" type="submit">Cancel lesson</button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
      <section className="mt-10 max-w-xl">
        <h2 className="text-2xl">Schedule a lesson</h2>
        {teachers.length === 0 ? (
          <p className="mt-3 text-gray-700">A teacher must opt in to a grade before you can schedule them.</p>
        ) : (
          <div className="mt-4">
            <ActionForm action={createLesson} submitLabel="Schedule lesson" pendingLabel="Scheduling…">
              <input type="hidden" name="returnTo" value="/admin/sessions" />
              <Field label="Title" name="title" required />
              <div className="grid gap-1.5">
                <label htmlFor="teacherId" className="text-[15px] font-medium">Teacher</label>
                <select id="teacherId" name="teacherId" className="select" required>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="grade" className="text-[15px] font-medium">Grade</label>
                <select id="grade" name="grade" className="select" required>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
              <Field label="Starts" name="startsAt" type="datetime-local" required />
              <Field label="Ends" name="endsAt" type="datetime-local" required />
              <Field label="Manual Meet link" name="meetLink" type="url" autoComplete="off" />
              <input type="hidden" name="meetMode" value="manual" />
            </ActionForm>
          </div>
        )}
      </section>
    </>
  );
}
