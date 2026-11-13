import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  await requireActor("/admin/students");
  const store = getStore();
  const users = await store.listUsers();
  const enrollments = await store.listEnrollments();
  const students = users.filter((user) => user.accountType === "student");
  return (
    <>
      <h1 className="text-4xl">Students</h1>
      <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {students.map((student) => {
          const active = enrollments.find((item) => item.studentId === student.id && item.active);
          return (
            <li key={student.id} className="py-4">
              <p className="text-lg">{student.fullName}</p>
              <p className="text-sm text-gray-700">
                {student.email}
                {active ? `, Grade ${active.grade} since ${formatWhen(active.startedAt)}` : ", not enrolled"}
              </p>
            </li>
          );
        })}
        {students.length === 0 ? <li className="py-4 text-gray-700">No students yet.</li> : null}
      </ul>
    </>
  );
}
