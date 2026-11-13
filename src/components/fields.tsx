import type { ReactNode } from "react";
import { GRADES, type Grade } from "@/domain/grades";

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = false,
  hint,
  defaultValue,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
  min?: number;
  max?: number;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-[15px] font-medium text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm leading-5 text-gray-700">
          {hint}
        </p>
      ) : null}
      <input
        id={name}
        name={name}
        type={type}
        className="field"
        autoComplete={autoComplete}
        required={required}
        spellCheck={type === "email" || type === "password" ? false : undefined}
        aria-describedby={hintId}
        defaultValue={defaultValue}
        min={min}
        max={max}
        inputMode={type === "number" ? "numeric" : undefined}
      />
    </div>
  );
}

export function Area({
  label,
  name,
  required = false,
  hint,
  defaultValue,
  rows = 5,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
  rows?: number;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-[15px] font-medium text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm leading-5 text-gray-700">
          {hint}
        </p>
      ) : null}
      <textarea id={name} name={name} className="area" required={required} rows={rows} aria-describedby={hintId} defaultValue={defaultValue} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  children,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  children: ReactNode;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-[15px] font-medium text-ink">
        {label}
      </label>
      <select id={name} name={name} className="select" defaultValue={defaultValue} required={required}>
        {children}
      </select>
    </div>
  );
}

export function GradeChecks({
  legend,
  name,
  defaultChecked = [],
}: {
  legend: string;
  name: string;
  defaultChecked?: readonly Grade[];
}) {
  return (
    <fieldset>
      <legend className="text-[15px] font-medium text-ink">{legend}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GRADES.map((grade) => (
          <label key={grade} className="flex min-h-11 items-center gap-2 border border-gray-200 bg-white px-3">
            <input
              type="checkbox"
              name={name}
              value={grade}
              defaultChecked={defaultChecked.includes(grade)}
              className="size-4 accent-brand-700"
            />
            <span>Grade {grade}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Check({ name, label, value = "yes" }: { name: string; label: string; value?: string }) {
  return (
    <label className="flex min-h-11 items-start gap-3">
      <input type="checkbox" name={name} value={value} className="mt-1 size-4 accent-brand-700" />
      <span className="text-[15px] leading-6">{label}</span>
    </label>
  );
}
