import { requireActor } from "@/lib/actor";
import { StudioFrame } from "@/components/shell";

export default async function TeacherStudioLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("/teachers/dashboard");
  return (
    <StudioFrame
      actor={actor}
      showGoogle
      items={[
        { href: "/teachers/dashboard", label: "Dashboard", exact: true },
        { href: "/teachers/grades", label: "Grades" },
        { href: "/teachers/sessions", label: "Lessons", exact: true },
        { href: "/teachers/sessions/new", label: "New lesson" },
        { href: "/teachers/assignments", label: "Assignments" },
      ]}
    >
      {children}
    </StudioFrame>
  );
}
