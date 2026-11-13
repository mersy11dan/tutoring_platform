import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { PublicHeader } from "@/components/shell";
import { signUpStudent } from "@/app/actions/auth";
import { getActor } from "@/lib/actor";

export const metadata = { title: "Create a student account" };

export default async function StudentSignUpPage() {
  const actor = await getActor();
  if (actor?.accountType === "student") redirect("/students/dashboard");
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-md px-6 py-16">
        <h1 className="text-4xl">Create a student account</h1>
        <p className="mt-3 text-gray-700">After this, you enroll in the one grade you are in now.</p>
        <div className="mt-8">
          <ActionForm action={signUpStudent} submitLabel="Create account" pendingLabel="Creating account…">
            <Field label="Full name" name="fullName" autoComplete="name" required />
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            <Field label="Password" name="password" type="password" autoComplete="new-password" required hint="At least 8 characters." />
          </ActionForm>
        </div>
        <p className="mt-6 text-[15px]">
          Already enrolled?{" "}
          <Link href="/students/sign-in" className="link">
            Student sign in
          </Link>
        </p>
      </main>
    </>
  );
}
