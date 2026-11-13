import Link from "next/link";
import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  await requireActor("/admin");
  const store = getStore();
  const applications = await store.listApplications();
  const students = (await store.listEnrollments()).filter((item) => item.active);
  const sessions = (await store.listSessions()).filter((item) => item.status === "scheduled");
  const waiting = applications.filter((item) => item.hiringStatus === "submitted" || item.hiringStatus === "assessed").length;
  return (
    <>
      <h1 className="text-4xl">Review desk</h1>
      <p className="mt-3 max-w-prose text-gray-700">Applications, interviews, assessments, and the people already in a grade.</p>
      <ul className="stat-rail">
        <li>
          <p className="text-sm text-gray-700">Waiting on you</p>
          <p className="numeral mt-2 text-5xl">{waiting}</p>
        </li>
        <li>
          <p className="text-sm text-gray-700">Active students</p>
          <p className="numeral mt-2 text-5xl">{students.length}</p>
        </li>
        <li>
          <p className="text-sm text-gray-700">Scheduled lessons</p>
          <p className="numeral mt-2 text-5xl">{sessions.length}</p>
        </li>
      </ul>
      <ul className="mt-8 grid gap-2 text-[15px]">
        <li><Link className="link" href="/admin/applications">Review applications</Link></li>
        <li><Link className="link" href="/admin/interviews">Interviews</Link></li>
        <li><Link className="link" href="/admin/assessments">Assessments</Link></li>
      </ul>
    </>
  );
}
