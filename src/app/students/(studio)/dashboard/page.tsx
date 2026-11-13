import Link from "next/link";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Student dashboard" };

export default async function StudentDashboardPage() {
  const actor = await requireActor("/students/dashboard");
  const store = getStore();
  const enrollment = await store.getActiveEnrollment(actor.id);
  const sessions = enrollment ? await store.listSessions({ grade: enrollment.grade }) : [];
  const assignments = enrollment ? await store.listAssignments(enrollment.grade) : [];
  const upcoming = sessions.filter((session) => session.status === "scheduled");
  return (
    <>
      <h1 className="text-4xl">Hello, {actor.fullName.split(" ")[0]}</h1>
      {enrollment ? (
        <>
          <p className="mt-3 max-w-prose text-gray-700">
            You are enrolled in Grade {enrollment.grade}. Lessons and assignments on this page are for that grade only.
          </p>
          <p className="mt-6 font-display text-7xl leading-none text-brand-800">{enrollment.grade}</p>
          <section className="mt-10">
            <h2 className="text-2xl">Next lesson</h2>
            {upcoming[0] ? (
              <p className="mt-3">
                <Link href={`/students/sessions/${upcoming[0].id}`} className="link">
                  {upcoming[0].title}
                </Link>
                <span className="mt-1 block text-sm text-gray-700 tabular-nums">{formatWhen(upcoming[0].startsAt)}</span>
              </p>
            ) : (
              <p className="mt-3 text-gray-700">No upcoming lesson for Grade {enrollment.grade}.</p>
            )}
          </section>
          <section className="mt-8">
            <h2 className="text-2xl">Assignments</h2>
            <p className="mt-3 text-gray-700">{assignments.length === 0 ? "Nothing assigned yet." : `${assignments.length} for Grade ${enrollment.grade}.`}</p>
          </section>
        </>
      ) : (
        <p className="mt-4 max-w-prose text-gray-700">
          You are not enrolled yet.{" "}
          <Link href="/students/enroll" className="link">
            Choose your grade
          </Link>
          .
        </p>
      )}
    </>
  );
}
