import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { PublicHeader } from "@/components/shell";
import { signInStudent } from "@/app/actions/auth";
import { getActor } from "@/lib/actor";
import { safeNext } from "@/domain/access";

export const metadata = { title: "Student sign in" };

export default async function StudentSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const actor = await getActor();
  if (actor?.accountType === "student") redirect("/students/dashboard");
  const next = safeNext((await searchParams).next, "");
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-md px-6 py-16">
        <h1 className="text-4xl">Student sign in</h1>
        <p className="mt-3 text-gray-700">Use the email and password from your student account.</p>
        <div className="mt-8">
          <ActionForm action={signInStudent} submitLabel="Sign in" pendingLabel="Signing in…">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          </ActionForm>
        </div>
        <p className="mt-6 text-[15px]">
          New here?{" "}
          <Link href="/students/sign-up" className="link">
            Create a student account
          </Link>
        </p>
      </main>
    </>
  );
}
