import { AdminDashboard } from "@/components/nivaran/admin-dashboard";
import { PortalShell } from "@/components/nivaran/portal-shell";
import { WardMap } from "@/components/nivaran/ward-map";

export default function AnalyticsPage(){return <PortalShell role="admin" title="Service patterns"><div className="mb-6"><p className="eyebrow">Aggregated ward-level view</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Operational analytics</h2><p className="mt-2 text-sm text-muted-foreground">No reporter identity or exact public residence locations are included.</p></div><AdminDashboard/><WardMap/></PortalShell>}
