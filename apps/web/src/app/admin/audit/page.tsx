import { PortalShell } from "@/components/nivaran/portal-shell";import { AuditView } from "@/components/nivaran/audit-view";
export default function AuditPage(){return <PortalShell role="admin" title="Audit trail"><div className="mb-6"><p className="eyebrow">Decision provenance</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Who changed what—and why</h2></div><AuditView/></PortalShell>}

