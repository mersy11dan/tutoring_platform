import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { createLesson } from "@/app/actions/teaching";
import { GOOGLE_NOT_CONNECTED, googleConnection, readGoogleEnv } from "@/lib/google";
import { requireActor } from "@/lib/actor";
import { getStore } from "@/lib/store";

export const metadata = { title: "New lesson" };

export default async function NewLessonPage() {
  const actor = await requireActor("/teachers/sessions/new");
  const approvals = (await getStore().getApprovals(actor.id)).filter((item) => item.optedIn);
  const google = googleConnection(readGoogleEnv());
  return (
    <>
      <h1 className="text-4xl">New lesson</h1>
      <p className="mt-3 max-w-prose text-gray-700">Times are in Africa/Addis Ababa. Students in the lesson’s grade can see it.</p>
      {!google.connected ? <p className="mt-4 text-sm text-warning-800">{GOOGLE_NOT_CONNECTED} Paste a Meet link, or connect Google later.</p> : null}
      {approvals.length === 0 ? (
        <p className="mt-6 text-gray-700">Opt in to an approved grade before scheduling a lesson.</p>
      ) : (
        <div className="mt-8 max-w-xl">
          <ActionForm action={createLesson} submitLabel="Schedule lesson" pendingLabel="Scheduling…">
            <input type="hidden" name="returnTo" value="/teachers/sessions/new" />
            <Field label="Title" name="title" required />
            <div className="grid gap-1.5">
              <label htmlFor="grade" className="text-[15px] font-medium">Grade</label>
              <select id="grade" name="grade" className="select" required defaultValue={String(approvals[0]?.grade ?? "")}>
                {approvals.map((approval) => (
                  <option key={approval.grade} value={approval.grade}>Grade {approval.grade}</option>
                ))}
              </select>
            </div>
            <Field label="Starts" name="startsAt" type="datetime-local" required />
            <Field label="Ends" name="endsAt" type="datetime-local" required />
            <fieldset>
              <legend className="text-[15px] font-medium">Meet link</legend>
              <label className="mt-2 flex items-center gap-2">
                <input type="radio" name="meetMode" value="manual" defaultChecked className="size-4 accent-brand-700" />
                Paste a link
              </label>
              <label className="mt-2 flex items-center gap-2">
                <input type="radio" name="meetMode" value="google" disabled={!google.connected} className="size-4 accent-brand-700" />
                Create with Google {google.connected ? "" : "(unavailable)"}
              </label>
            </fieldset>
            <Field label="Manual Meet link" name="meetLink" type="url" autoComplete="off" hint="Leave blank if you will add it later." />
          </ActionForm>
        </div>
      )}
    </>
  );
}
