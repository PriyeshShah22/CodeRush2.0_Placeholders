import { PortalShell } from "@/components/nivaran/portal-shell";import { DepartmentTasks } from "@/components/nivaran/department-tasks";
export default function TasksPage(){return <PortalShell role="department" title="Assigned tasks"><div className="mb-6"><p className="eyebrow">Roads & Public Works · all tasks</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Operational queue</h2></div><DepartmentTasks/></PortalShell>}

