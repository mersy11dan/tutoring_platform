import Link from "next/link";
import { cancelLesson } from "@/app/actions/teaching";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Your lessons" };

export default async function TeacherSessionsPage() {
  const actor = await requireActor("/teachers/sessions");
  const sessions = await getStore().listSessions({ teacherId: actor.id, includeCancelled: true });
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">Lessons</h1>
        <Link href="/teachers/sessions/new" className="btn btn-primary">New lesson</Link>
      </div>
      <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {sessions.map((session) => (
          <li key={session.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-lg">{session.title}</p>
              <p className="text-sm text-gray-700 tabular-nums">
                Grade {session.grade}, {formatWhen(session.startsAt)}, {session.status}
                {session.meetLink ? ", link added" : ", no link"}
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
        ))}
        {sessions.length === 0 ? <li className="py-4 text-gray-700">No lessons yet.</li> : null}
      </ul>
    </>
  );
}
