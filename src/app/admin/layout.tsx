import { requireActor } from "@/lib/actor";
import { StudioFrame } from "@/components/shell";

const items = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/interviews", label: "Interviews" },
  { href: "/admin/assessments", label: "Assessments" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/sessions", label: "Lessons" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("/admin");
  return (
    <StudioFrame actor={actor} items={items} showGoogle>
      {children}
    </StudioFrame>
  );
}
