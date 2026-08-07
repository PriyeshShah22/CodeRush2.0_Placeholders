import { PortalShell } from "@/components/nivaran/portal-shell";
import { DepartmentTasks } from "@/components/nivaran/department-tasks";
import { DepartmentQueueIntro } from "@/components/nivaran/translated-page-intros";

export default function TasksPage() {
  return <PortalShell role="department" title="Assigned tasks"><DepartmentQueueIntro /><DepartmentTasks /></PortalShell>;
}
