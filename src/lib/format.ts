const when = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Addis_Ababa",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatWhen(iso: string): string {
  return `${when.format(new Date(iso))} EAT`;
}

export function addisInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+03:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}
