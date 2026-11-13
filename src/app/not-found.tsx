import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-4xl">That page is not here</h1>
      <p className="mt-4 text-gray-700">Check the address, or go back to the studio home.</p>
      <p className="mt-6">
        <Link href="/" className="btn btn-primary">Go home</Link>
      </p>
    </main>
  );
}
