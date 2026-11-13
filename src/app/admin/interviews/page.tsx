import Link from "next/link";
import { requireActor } from "@/lib/actor";
import { formatWhen } from "@/lib/format";
import { getStore } from "@/lib/store";

export const metadata = { title: "Interviews" };

export default async function InterviewsPage() {
  await requireActor("/admin/interviews");
  const store = getStore();
  const interviews = await store.listInterviews();
  const applications = await store.listApplications();
  const byId = new Map(applications.map((item) => [item.id, item]));
  return (
    <>
      <h1 className="text-4xl">Interviews</h1>
      <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {interviews.map((interview) => {
          const application = byId.get(interview.applicationId);
          return (
            <li key={interview.id} className="py-4">
              <Link href={`/admin/interviews/${interview.id}`} className="link text-lg">
                {application?.fullName ?? "Application"}
              </Link>
              <p className="text-sm text-gray-700 tabular-nums">
                {formatWhen(interview.scheduledAt)}
                {interview.outcome ? `, outcome ${interview.outcome}` : ""}
              </p>
            </li>
          );
        })}
        {interviews.length === 0 ? <li className="py-4 text-gray-700">No interviews scheduled.</li> : null}
      </ul>
    </>
  );
}
