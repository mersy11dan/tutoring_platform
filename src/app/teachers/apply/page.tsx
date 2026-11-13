import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Area, Field, GradeChecks } from "@/components/fields";
import { PublicHeader } from "@/components/shell";
import { submitApplication } from "@/app/actions/hiring";

export const metadata = { title: "Apply to teach" };

export default function ApplyPage() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-xl px-6 py-16">
        <h1 className="text-4xl">Apply to teach</h1>
        <p className="mt-3 max-w-prose text-gray-700">
          This is an application, not an account that can teach. Kony or Sisay will interview you, then you take an assessment for each grade you request.
        </p>
        <div className="mt-8">
          <ActionForm action={submitApplication} submitLabel="Submit application" pendingLabel="Submitting…">
            <Field label="Full name" name="fullName" autoComplete="name" required />
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            <Field label="Password" name="password" type="password" autoComplete="new-password" required hint="You will use this to check your application." />
            <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
            <Field label="Education" name="education" autoComplete="off" required />
            <Area label="Experience" name="experience" required />
            <GradeChecks legend="Grades you want to teach" name="requestedGrades" />
            <Area label="Statement" name="statement" required hint="A short note on why you want to teach these grades." />
          </ActionForm>
        </div>
        <p className="mt-6 text-[15px]">
          Already applied?{" "}
          <Link href="/teachers/sign-in" className="link">
            Teacher sign in
          </Link>
        </p>
      </main>
    </>
  );
}
