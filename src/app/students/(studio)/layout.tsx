import { requireActor } from "@/lib/actor";
import { StudioFrame } from "@/components/shell";

export default async function StudentStudioLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("/students/dashboard");
  return (
    <StudioFrame
      actor={actor}
      items={[
        { href: "/students/dashboard", label: "Dashboard", exact: true },
        { href: "/students/enroll", label: "Grade" },
        { href: "/students/sessions", label: "Lessons", exact: true },
        { href: "/students/assignments", label: "Assignments" },
      ]}
    >
      {children}
    </StudioFrame>
  );
}
