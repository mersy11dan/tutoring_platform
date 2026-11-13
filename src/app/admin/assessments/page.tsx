import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";

export const metadata = { title: "Assessments" };

export default async function AssessmentsPage() {
  await requireActor("/admin/assessments");
  const store = getStore();
  const assessments = await store.listAssessments();
  const applications = await store.listApplications();
  const byId = new Map(applications.map((item) => [item.id, item]));
  return (
    <>
      <h1 className="text-4xl">Assessments</h1>
      <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {assessments.map((assessment) => {
          const application = byId.get(assessment.applicationId);
          if (!application) return null;
          return (
            <li key={assessment.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <Link href={`/admin/assessments/${application.id}`} className="link text-lg">
                {application.fullName}
              </Link>
              <StatusPill status={application.hiringStatus} />
            </li>
          );
        })}
        {assessments.length === 0 ? <li className="py-4 text-gray-700">No assessments yet.</li> : null}
      </ul>
    </>
  );
}
