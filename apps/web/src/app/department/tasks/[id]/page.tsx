import { PortalShell } from "@/components/nivaran/portal-shell";import { TaskWorkspace } from "@/components/nivaran/task-workspace";
export default async function TaskPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PortalShell role="department" title="Task workspace"><TaskWorkspace id={id}/></PortalShell>}

