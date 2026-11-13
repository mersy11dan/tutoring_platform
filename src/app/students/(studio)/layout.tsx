import { requireActor } from "@/lib/actor";
import { StudioFrame } from "@/components/shell";

export default async function StudentStudioLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("/students/dashboard");
  return (
    <StudioFrame
      actor={actor}
      area="Students"
      items={[
        { href: "/students/dashboard", label: "Home", exact: true },
        { href: "/students/enroll", label: "Your grade" },
        { href: "/students/sessions", label: "Lessons" },
        { href: "/students/assignments", label: "Assignments" },
      ]}
    >
      {children}
    </StudioFrame>
  );
}
