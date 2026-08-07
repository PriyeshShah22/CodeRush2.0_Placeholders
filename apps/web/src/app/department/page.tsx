import { PortalShell } from "@/components/nivaran/portal-shell";
import { DepartmentTasks } from "@/components/nivaran/department-tasks";
import { DepartmentPageIntro } from "@/components/nivaran/translated-page-intros";

export default function DepartmentPage() {
  return (
    <PortalShell role="department" title="Department workspace">
      <DepartmentPageIntro />
      <DepartmentTasks />
    </PortalShell>
  );
}
