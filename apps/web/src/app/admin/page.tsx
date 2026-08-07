import { PortalShell } from "@/components/nivaran/portal-shell";
import { AdminDashboard } from "@/components/nivaran/admin-dashboard";

export default function AdminPage() {
  return (
    <PortalShell role="admin" title="Operations overview">
      <div className="mb-6">
        <p className="eyebrow">Live municipal workflow</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">
          One accountable view
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Incident totals, service deadlines, and complaint locations are
          calculated directly from persisted workflow records.
        </p>
      </div>
      <AdminDashboard />
    </PortalShell>
  );
}
