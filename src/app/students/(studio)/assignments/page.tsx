import Link from "next/link";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Assignments" };

export default async function StudentAssignmentsPage() {
  const actor = await requireActor("/students/assignments");
  const store = getStore();
  const enrollment = await store.getActiveEnrollment(actor.id);
  if (!enrollment) {
    return (
      <>
        <h1 className="text-4xl">Assignments</h1>
        <p className="mt-3">
          <Link href="/students/enroll" className="link">Enroll in a grade</Link> to see its assignments.
        </p>
      </>
    );
  }
  const assignments = await store.listAssignments(enrollment.grade);
  return (
    <>
      <h1 className="text-4xl">Grade {enrollment.grade} assignments</h1>
      {assignments.length === 0 ? (
        <p className="mt-4 text-gray-700">No assignments for Grade {enrollment.grade} yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="py-4">
              <p className="text-lg">{assignment.title}</p>
              <p className="mt-1 max-w-prose text-[15px] text-gray-700">{assignment.instructions}</p>
              <p className="mt-1 text-sm text-gray-700 tabular-nums">{assignment.dueAt ? `Due ${formatWhen(assignment.dueAt)}` : "No due date"}</p>
              {assignment.classroomCourseworkId ? (
                <p className="text-sm text-gray-700">Also in Google Classroom.</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
