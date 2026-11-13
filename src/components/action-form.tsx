"use client";

import { useFormStatus } from "react-dom";
import { useActionState, type ReactNode } from "react";

export type FormState = { error: string };

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  submitClass = "btn btn-primary",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  submitClass?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: "" });
  return (
    <form action={formAction} className="grid gap-4">
      {state.error ? (
        <p role="alert" className="border border-error-100 bg-error-50 px-3 py-2 text-[15px] text-error-700">
          {state.error}
        </p>
      ) : null}
      {children}
      {submitLabel ? (
        <div>
          <button type="submit" className={submitClass} disabled={pending}>
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function PendingButton({
  children,
  pendingLabel = "Saving…",
  className = "btn btn-primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button {...props} className={className} disabled={pending || props.disabled}>
      {pending ? pendingLabel : children}
    </button>
  );
}
