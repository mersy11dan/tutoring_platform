import Link from "next/link";
import { notFound } from "next/navigation";
import { GOOGLE_NOT_CONNECTED, googleConnection, readGoogleEnv } from "@/lib/google";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Lesson" };

export default async function StudentSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor("/students/sessions");
  const { id } = await params;
  const store = getStore();
  const enrollment = await store.getActiveEnrollment(actor.id);
  const session = await store.getSession(id);
  if (!session || !enrollment || session.grade !== enrollment.grade || session.status === "cancelled") notFound();
  const teacher = await store.getUser(session.teacherId);
  const google = googleConnection(readGoogleEnv());
  return (
    <>
      <p className="text-sm text-gray-700">Grade {session.grade}</p>
      <h1 className="mt-2 text-4xl">{session.title}</h1>
      <p className="mt-3 tabular-nums text-gray-700">
        {formatWhen(session.startsAt)} to {formatWhen(session.endsAt)}
      </p>
      <p className="mt-2 text-gray-700">Teacher: {teacher?.fullName ?? "Unassigned"}</p>
      <section className="mt-8 panel p-5">
        <h2 className="text-2xl">Meet link</h2>
        {session.meetLink ? (
          <p className="mt-3">
            <a href={session.meetLink} className="link" rel="noreferrer">
              Join the lesson
            </a>
            <span className="mt-1 block text-sm text-gray-700">
              {session.meetSource === "google" ? "Created with Google Calendar." : "Added by hand."}
            </span>
          </p>
        ) : (
          <p className="mt-3 text-gray-700">No meeting link yet.</p>
        )}
        {!google.connected ? <p className="mt-3 text-sm text-warning-800">{GOOGLE_NOT_CONNECTED}</p> : null}
      </section>
      <p className="mt-6">
        <Link href="/students/sessions" className="link">
          All Grade {enrollment.grade} lessons
        </Link>
      </p>
    </>
  );
}
