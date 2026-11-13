import Link from "next/link";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Teacher dashboard" };

export default async function TeacherDashboardPage() {
  const actor = await requireActor("/teachers/dashboard");
  const store = getStore();
  const approvals = await store.getApprovals(actor.id);
  const teaching = approvals.filter((item) => item.optedIn);
  const sessions = await store.listSessions({ teacherId: actor.id });
  return (
    <>
      <h1 className="text-4xl">Your studio</h1>
      <p className="mt-3 max-w-prose text-gray-700">
        You can teach {teaching.length === 0 ? "no grades yet" : teaching.map((item) => `Grade ${item.grade}`).join(", ")}.
        Opt in only to grades you were approved for.
      </p>
      {actor.isAdmin ? (
        <p className="mt-4">
          <Link href="/admin" className="link">Open the admin desk</Link>
        </p>
      ) : null}
      <section className="mt-8">
        <h2 className="text-2xl">Upcoming lessons</h2>
        <ul className="mt-3 divide-y divide-gray-200 border-y border-gray-200">
          {sessions.filter((session) => session.status === "scheduled").slice(0, 5).map((session) => (
            <li key={session.id} className="py-3">
              <p>{session.title}</p>
              <p className="text-sm text-gray-700 tabular-nums">Grade {session.grade}, {formatWhen(session.startsAt)}</p>
            </li>
          ))}
          {sessions.filter((session) => session.status === "scheduled").length === 0 ? (
            <li className="py-3 text-gray-700">No lessons scheduled.</li>
          ) : null}
        </ul>
        <p className="mt-4">
          <Link href="/teachers/sessions/new" className="btn btn-primary">Schedule a lesson</Link>
        </p>
      </section>
    </>
  );
}
