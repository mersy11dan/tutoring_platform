import type { HiringStatus } from "@/domain/hiring";
import { HIRING_LABELS } from "@/domain/hiring";

const tones: Record<HiringStatus, string> = {
  submitted: "bg-brand-100 text-brand-800",
  interview_scheduled: "bg-brand-100 text-brand-800",
  interviewed: "bg-brand-200 text-brand-900",
  assessment_in_progress: "bg-warning-100 text-warning-800",
  assessed: "bg-warning-100 text-warning-800",
  approved: "bg-success-100 text-success-700",
  on_hold: "bg-gray-200 text-gray-800",
  rejected: "bg-error-100 text-error-700",
};

export function StatusPill({ status }: { status: HiringStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-sm font-medium ${tones[status]}`}>{HIRING_LABELS[status]}</span>
  );
}
