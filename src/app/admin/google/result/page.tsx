import Link from "next/link";
import { cookies } from "next/headers";
import { requireActor } from "@/lib/actor";

export const metadata = { title: "Google consent" };

export default async function GoogleResultPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireActor("/admin/google/result");
  const failed = (await searchParams).error === "1";
  const token = (await cookies()).get("google_refresh_display")?.value;
  return (
    <>
      <h1 className="text-4xl">Google consent</h1>
      {token && !failed ? (
        <>
          <p className="mt-4 max-w-prose">
            Copy this refresh token into GOOGLE_REFRESH_TOKEN on the server. It is not saved in the database, and this page stops showing it after two minutes.
          </p>
          <p className="mt-4 break-all border border-gray-200 bg-white p-3 text-sm">{token}</p>
        </>
      ) : (
        <p className="mt-4 max-w-prose">Google not connected yet. The consent step did not finish. Check the client settings and try again.</p>
      )}
      <p className="mt-6">
        <Link href="/admin/settings" className="link">Back to settings</Link>
      </p>
    </>
  );
}
