import Link from "next/link";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Lessons" };

export default async function StudentSessionsPage() {
  const actor = await requireActor("/students/sessions");
  const store = getStore();
  const enrollment = await store.getActiveEnrollment(actor.id);
  if (!enrollment) {
    return (
      <>
        <h1 className="text-4xl">Lessons</h1>
        <p className="mt-3">
          <Link href="/students/enroll" className="link">Enroll in a grade</Link> to see its lessons.
        </p>
      </>
    );
  }
  const sessions = await store.listSessions({ grade: enrollment.grade });
  return (
    <>
      <h1 className="text-4xl">Grade {enrollment.grade} lessons</h1>
      {sessions.length === 0 ? (
        <p className="mt-4 text-gray-700">No lessons yet for Grade {enrollment.grade}.</p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
          {sessions.map((session) => (
            <li key={session.id} className="py-4">
              <Link href={`/students/sessions/${session.id}`} className="link text-lg">
                {session.title}
              </Link>
              <p className="text-sm text-gray-700 tabular-nums">{formatWhen(session.startsAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
