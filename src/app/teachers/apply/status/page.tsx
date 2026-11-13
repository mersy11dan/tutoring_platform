import Link from "next/link";
import { HIRING_LABELS, type HiringStatus } from "@/domain/hiring";
import { PublicHeader } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { refreshTeacherSession } from "@/app/actions/auth";
import { getActor } from "@/lib/actor";
import { getStore } from "@/lib/store";

export const metadata = { title: "Application status" };

const path: HiringStatus[] = [
  "submitted",
  "interview_scheduled",
  "interviewed",
  "assessment_in_progress",
  "assessed",
  "approved",
];

export default async function ApplicationStatusPage() {
  const actor = await getActor();
  if (!actor || actor.accountType === "student") {
    return (
      <>
        <PublicHeader />
        <main id="main" className="mx-auto max-w-xl px-6 py-16">
          <h1 className="text-4xl">Application status</h1>
          <p className="mt-3 text-gray-700">Sign in with the email you used on the application.</p>
          <p className="mt-6">
            <Link href="/teachers/sign-in?next=/teachers/apply/status" className="btn btn-primary">
              Teacher sign in
            </Link>
          </p>
        </main>
      </>
    );
  }

  const application = await getStore().getApplicationByUserId(actor.id);
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-4xl">Your application</h1>
        {actor.isAdmin ? (
          <p className="mt-4">
            <Link href="/admin" className="link">
              Open the admin desk
            </Link>
          </p>
        ) : null}
        {!application ? (
          <p className="mt-4 text-gray-700">There is no application on this account.</p>
        ) : (
          <>
            <div className="mt-4">
              <StatusPill status={application.hiringStatus} />
            </div>
            <p className="mt-4 text-gray-700">
              Requested grades: {application.requestedGrades.map((grade) => `Grade ${grade}`).join(", ")}.
            </p>
            {application.hiringStatus === "on_hold" ? (
              <p className="mt-4 border border-warning-100 bg-warning-50 px-3 py-2 text-[15px] text-warning-800">
                The application is on hold. Kony or Sisay will resume it or close it.
              </p>
            ) : null}
            {application.hiringStatus === "rejected" ? (
              <p className="mt-4 border border-error-100 bg-error-50 px-3 py-2 text-[15px] text-error-700">
                This application was not approved.
              </p>
            ) : null}
            {application.hiringStatus === "approved" ? (
              <form action={refreshTeacherSession} className="mt-6">
                <button className="btn btn-primary" type="submit">
                  Open your dashboard
                </button>
              </form>
            ) : null}
            <ol className="mt-8 grid gap-3">
              {path.map((status) => (
                <li key={status} className={status === application.hiringStatus ? "text-brand-900" : "text-gray-600"}>
                  <span className="font-display text-xl">{HIRING_LABELS[status]}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
    </>
  );
}
