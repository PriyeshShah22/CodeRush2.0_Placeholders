import { PortalShell } from "@/components/nivaran/portal-shell";
import { AuditView } from "@/components/nivaran/audit-view";
import { AuditPageIntro } from "@/components/nivaran/translated-page-intros";
export default function AuditPage(){return <PortalShell role="admin" title="Audit trail"><AuditPageIntro/><AuditView/></PortalShell>}
