import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  await requireActor("/admin/applications");
  const applications = await getStore().listApplications();
  return (
    <>
      <h1 className="text-4xl">Applications</h1>
      <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {applications.map((application) => (
          <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <Link href={`/admin/applications/${application.id}`} className="link text-lg">
                {application.fullName}
              </Link>
              <p className="text-sm text-gray-700">
                {application.requestedGrades.map((grade) => `Grade ${grade}`).join(", ")}
              </p>
            </div>
            <StatusPill status={application.hiringStatus} />
          </li>
        ))}
        {applications.length === 0 ? <li className="py-4 text-gray-700">No applications yet.</li> : null}
      </ul>
    </>
  );
}
