import { PortalShell } from "@/components/nivaran/portal-shell";
import { ConfigPage } from "@/components/nivaran/config-page";
import { AdminDepartmentsIntro } from "@/components/nivaran/translated-page-intros";
export default function DepartmentsPage(){return <PortalShell role="admin" title="Departments"><AdminDepartmentsIntro/><ConfigPage kind="departments"/></PortalShell>}
