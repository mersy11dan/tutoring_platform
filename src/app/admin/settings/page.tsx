import Link from "next/link";
import { adminEmails } from "@/lib/env";
import { GOOGLE_NOT_CONNECTED, googleConnection, googleCredentialsPresent, readGoogleEnv } from "@/lib/google";
import { isSupabaseConfigured } from "@/lib/supabase/service";
import { requireActor } from "@/lib/actor";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireActor("/admin/settings");
  const google = readGoogleEnv();
  const connection = googleConnection(google);
  const admins = adminEmails().length;
  return (
    <>
      <h1 className="text-4xl">Settings</h1>
      <p className="mt-3 max-w-prose text-gray-700">Connection status only. Secret values are not shown.</p>
      <dl className="mt-8 grid max-w-xl gap-4">
        <div className="panel p-4">
          <dt className="text-sm text-gray-700">Admin allowlist</dt>
          <dd className="mt-1">{admins === 0 ? "Not configured. ADMIN_EMAILS is empty." : `Configured. ${admins} ${admins === 1 ? "address" : "addresses"}.`}</dd>
        </div>
        <div className="panel p-4">
          <dt className="text-sm text-gray-700">Supabase</dt>
          <dd className="mt-1">{isSupabaseConfigured() ? "Connected." : "Not connected. The app is using local demo data."}</dd>
        </div>
        <div className="panel p-4">
          <dt className="text-sm text-gray-700">Google Meet and Classroom</dt>
          <dd className="mt-1">
            {connection.connected ? "Google is connected." : GOOGLE_NOT_CONNECTED}
            {!connection.connected && googleCredentialsPresent(google) ? " The OAuth client is present. Finish consent to store a refresh token." : ""}
          </dd>
          <p className="mt-3">
            <Link href="/admin/google/start" className="link">Connect Google</Link>
          </p>
        </div>
      </dl>
    </>
  );
}
