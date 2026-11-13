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
      <dl className="mt-8 grid gap-px bg-gray-200 sm:grid-cols-3">
        <div className="bg-white px-4 py-5">
          <dt className="text-sm text-gray-700">Waiting on you</dt>
          <dd className="font-display text-5xl text-brand-800">{waiting}</dd>
        </div>
        <div className="bg-white px-4 py-5">
          <dt className="text-sm text-gray-700">Active students</dt>
          <dd className="font-display text-5xl text-brand-800">{students.length}</dd>
        </div>
        <div className="bg-white px-4 py-5">
          <dt className="text-sm text-gray-700">Scheduled lessons</dt>
          <dd className="font-display text-5xl text-brand-800">{sessions.length}</dd>
        </div>
      </dl>
      <ul className="mt-8 grid gap-2 text-[15px]">
        <li><Link className="link" href="/admin/applications">Review applications</Link></li>
        <li><Link className="link" href="/admin/interviews">Interviews</Link></li>
        <li><Link className="link" href="/admin/assessments">Assessments</Link></li>
      </ul>
    </>
  );
}
