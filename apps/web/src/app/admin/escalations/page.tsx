import { PortalShell } from "@/components/nivaran/portal-shell";
import { EscalationCenter } from "@/components/nivaran/escalation-center";

export default function EscalationsPage() {
  return <PortalShell role="admin" title="SLA escalations"><EscalationCenter /></PortalShell>;
}
