import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { PublicHeader } from "@/components/shell";
import { signInTeacher } from "@/app/actions/auth";
import { safeNext } from "@/domain/access";
import { getActor } from "@/lib/actor";

export const metadata = { title: "Teacher sign in" };

export default async function TeacherSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const actor = await getActor();
  if (actor?.hiringStatus === "approved") redirect("/teachers/dashboard");
  if (actor?.isAdmin) redirect("/admin");
  if (actor && actor.accountType !== "student") redirect("/teachers/apply/status");
  const next = safeNext((await searchParams).next, "");
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-md px-6 py-16">
        <h1 className="text-4xl">Teacher sign in</h1>
        <p className="mt-3 text-gray-700">
          Approved teachers open their dashboard. Applicants see the status of their application. Admins land in the review desk.
        </p>
        <div className="mt-8">
          <ActionForm action={signInTeacher} submitLabel="Sign in" pendingLabel="Signing in…">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          </ActionForm>
        </div>
        <p className="mt-6 text-[15px]">
          Not applied yet?{" "}
          <Link href="/teachers/apply" className="link">
            Apply to teach
          </Link>
        </p>
      </main>
    </>
  );
}
