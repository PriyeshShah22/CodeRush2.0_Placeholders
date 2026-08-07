import { PortalShell } from "@/components/nivaran/portal-shell";import { ReviewerWorkspace } from "@/components/nivaran/reviewer-workspace";
export default async function ReviewerComplaintPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PortalShell role="reviewer" title="Complaint review"><ReviewerWorkspace id={id}/></PortalShell>}

