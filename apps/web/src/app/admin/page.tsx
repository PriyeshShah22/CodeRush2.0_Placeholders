import { PortalShell } from "@/components/nivaran/portal-shell";
import { AdminDashboard } from "@/components/nivaran/admin-dashboard";
import { ResolutionVerification } from "@/components/nivaran/resolution-verification";
import { AdminPageIntro } from "@/components/nivaran/translated-page-intros";

export default function AdminPage() {
  return (
    <PortalShell role="admin" title="Operations overview">
      <AdminPageIntro />
      <ResolutionVerification />
      <AdminDashboard />
    </PortalShell>
  );
}
