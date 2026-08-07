import { PortalShell } from "@/components/nivaran/portal-shell";
import { DepartmentTasks } from "@/components/nivaran/department-tasks";

export default function DepartmentPage() {
  return (
    <PortalShell role="department" title="Department workspace">
      <div className="mb-5">
        <p className="eyebrow">Persisted assignments</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">
          Priority work
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only tasks assigned to the signed-in department appear here, with the
          approved priority and resolution deadline.
        </p>
      </div>
      <DepartmentTasks />
    </PortalShell>
  );
}
