import Link from "next/link";
import { GRADES } from "@/domain/grades";
import { PublicHeader } from "@/components/shell";

const gradeCopy: Record<(typeof GRADES)[number], string> = {
  9: "A full path, not a sample. Enrollment, lessons, and assignments all start here.",
  10: "The same path, for the grade you are in now.",
  11: "The same path, for the grade you are in now.",
  12: "The same path, for the grade you are in now.",
};

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-5xl px-6 pb-24">
        <p className="mt-16 text-[15px] text-gray-700">High-school mathematics</p>
        <h1 className="mt-3 max-w-[16ch] text-balance text-[clamp(2.6rem,6vw,4.5rem)]">
          A teacher for the grade you are in.
        </h1>
        <p className="mt-6 max-w-prose text-pretty text-lg leading-8 text-gray-700">
          Students enroll in one grade, from Grade 9 through Grade 12. Teachers apply, sit an interview, and take an assessment before they teach.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/students/sign-up" className="btn btn-primary">
            Create a student account
          </Link>
          <Link href="/teachers/apply" className="btn btn-secondary">
            Apply to teach
          </Link>
        </div>

        <section className="mt-20 border-t border-gray-200 pt-8">
          <h2 className="text-3xl">Four grades</h2>
          <p className="mt-3 max-w-prose text-gray-700">
            Grade 9 is a complete path. Grades 10, 11, and 12 use that same path. A student keeps one active grade: the grade they are in now.
          </p>
          <ol className="mt-8 grid gap-px bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            {GRADES.map((grade) => (
              <li key={grade} className="bg-white px-5 py-6">
                <p className="font-display text-6xl leading-none text-brand-800">{grade}</p>
                <p className="mt-4 text-[15px] leading-6 text-gray-700">Grade {grade}. {gradeCopy[grade]}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl">Students</h2>
            <p className="mt-3 max-w-prose text-gray-700">
              Sign up, enroll in your grade, and see only that grade’s lessons and assignments. Lessons use a Google Meet link. Work can live in Google Classroom once it is connected.
            </p>
            <p className="mt-4">
              <Link href="/students/sign-in" className="link">
                Student sign in
              </Link>
            </p>
          </div>
          <div>
            <h2 className="text-3xl">Teachers</h2>
            <ol className="mt-4 grid gap-4">
              <li>
                <p className="font-display text-2xl text-brand-800">1</p>
                <p className="text-gray-700">Apply with the grades you want to teach.</p>
              </li>
              <li>
                <p className="font-display text-2xl text-brand-800">2</p>
                <p className="text-gray-700">Kony or Sisay interviews you and records the outcome.</p>
              </li>
              <li>
                <p className="font-display text-2xl text-brand-800">3</p>
                <p className="text-gray-700">A score of 70 or above makes a grade eligible. All four grades need a stronger result, and an admin confirms it.</p>
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
          Kony and Sisay run this studio. The product name is still open. Google Meet and Classroom stay off until their accounts are connected.
        </p>
      </footer>
    </>
  );
}
