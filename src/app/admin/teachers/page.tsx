import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";

export const metadata = { title: "Teachers" };

export default async function TeachersPage() {
  await requireActor("/admin/teachers");
  const store = getStore();
  const approvals = await store.listApprovals();
  const users = await store.listUsers();
  const byTeacher = new Map<string, typeof approvals>();
  for (const approval of approvals) {
    const list = byTeacher.get(approval.teacherId) ?? [];
    list.push(approval);
    byTeacher.set(approval.teacherId, list);
  }
  return (
    <>
      <h1 className="text-4xl">Teachers</h1>
      <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {[...byTeacher.entries()].map(([teacherId, rows]) => {
          const teacher = users.find((user) => user.id === teacherId);
          const teaching = rows.filter((row) => row.optedIn).map((row) => row.grade);
          return (
            <li key={teacherId} className="py-4">
              <p className="text-lg">{teacher?.fullName ?? "Teacher"}</p>
              <p className="text-sm text-gray-700">
                Approved: {rows.map((row) => `Grade ${row.grade}`).join(", ")}.
                {rows.some((row) => row.allFour) ? " All four confirmed." : ""}
                {rows.some((row) => row.source === "override") ? " Includes an override." : ""}
              </p>
              <p className="text-sm text-gray-700">
                Teaching now: {teaching.length ? teaching.map((grade) => `Grade ${grade}`).join(", ") : "none yet"}.
              </p>
            </li>
          );
        })}
        {byTeacher.size === 0 ? <li className="py-4 text-gray-700">No approved teachers yet.</li> : null}
      </ul>
    </>
  );
}
