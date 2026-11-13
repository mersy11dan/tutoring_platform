export const GRADES = [9, 10, 11, 12] as const;

export type Grade = (typeof GRADES)[number];

export function isGrade(value: number): value is Grade {
  return (GRADES as readonly number[]).includes(value);
}

export function parseGrade(value: unknown): Grade | null {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number) || !isGrade(number)) return null;
  return number;
}

export function uniqueGrades(values: readonly Grade[]): Grade[] {
  return GRADES.filter((grade) => values.includes(grade));
}

export function parseGradeList(values: FormDataEntryValue[]): Grade[] {
  const grades: Grade[] = [];
  for (const value of values) {
    const grade = parseGrade(value);
    if (grade && !grades.includes(grade)) grades.push(grade);
  }
  return uniqueGrades(grades);
}
