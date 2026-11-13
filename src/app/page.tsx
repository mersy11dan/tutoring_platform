import Link from "next/link";
import { GRADES } from "@/domain/grades";
import { PublicHeader } from "@/components/shell";

const gradeNote: Record<(typeof GRADES)[number], string> = {
  9: "Enrollment, lessons, and assignments.",
  10: "The same work, for this year.",
  11: "One active grade. Lessons stay with it.",
  12: "The last year of high school here.",
};

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h1 className="display mt-16">Grade 9 is a full year here. So are 10, 11, and 12.</h1>
        <p className="mt-6 max-w-[var(--measure)] text-pretty text-[var(--text-lead)] leading-8 text-gray-700">
          A student enrolls in the one grade they are in. A teacher is hired only for grades they passed: 70 or above, and a harder bar to teach all four.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/students/sign-up" className="btn btn-primary">
            Create a student account
          </Link>
          <Link href="/teachers/apply" className="btn btn-secondary">
            Apply to teach
          </Link>
        </div>

        <section className="mt-16" aria-labelledby="grades-heading">
          <h2 id="grades-heading" className="text-[var(--text-title)]">
            The four grades
          </h2>
          <ol className="grade-rail">
            {GRADES.map((grade) => (
              <li key={grade}>
                <p className="numeral text-6xl">{grade}</p>
                <p className="mt-3 text-[var(--text-small)] leading-6 text-gray-700">
                  Grade {grade}. {gradeNote[grade]}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 grid gap-10 border-t border-gray-200 pt-8 md:grid-cols-2" aria-labelledby="ways-in">
          <h2 id="ways-in" className="sr-only">
            Ways in
          </h2>
          <div>
            <h3 className="text-2xl">Students</h3>
            <p className="mt-3 max-w-[var(--measure)] text-gray-700">
              Sign up, choose your grade, and see only that grade’s lessons and assignments. A lesson can use a Meet link. Assignments stay in MathPath until Classroom is connected.
            </p>
            <p className="mt-4">
              <Link href="/students/sign-in" className="link">
                Student sign in
              </Link>
            </p>
          </div>
          <div>
            <h3 className="text-2xl">Teachers</h3>
            <ol className="mt-4 grid gap-4">
              <li>
                <p className="numeral text-3xl">1</p>
                <p className="text-gray-700">Apply with the grades you want to teach.</p>
              </li>
              <li>
                <p className="numeral text-3xl">2</p>
                <p className="text-gray-700">An admin interviews you and records the outcome.</p>
              </li>
              <li>
                <p className="numeral text-3xl">3</p>
                <p className="text-gray-700">Scores decide the grades you may teach. You opt in only to those grades.</p>
              </li>
            </ol>
            <p className="mt-4">
              <Link href="/teachers/sign-in" className="link">
                Teacher sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-200 px-6 py-8 text-sm text-gray-700">
        <p className="mx-auto max-w-5xl">
          MathPath. Google Meet and Classroom stay off until those accounts are connected.
        </p>
      </footer>
    </>
  );
}
