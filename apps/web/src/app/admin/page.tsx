import { PortalShell } from "@/components/nivaran/portal-shell";import { AdminDashboard } from "@/components/nivaran/admin-dashboard";
export default function AdminPage(){return <PortalShell role="admin" title="Supervisor overview"><div className="mb-6"><p className="eyebrow">Needs attention → health → patterns → evaluation</p><h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">Service accountability</h2></div><AdminDashboard/></PortalShell>}

