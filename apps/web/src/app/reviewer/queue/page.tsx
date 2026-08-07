import { PortalShell } from "@/components/nivaran/portal-shell";import { ReviewerQueue } from "@/components/nivaran/reviewer-queue";import { ReviewerQueueIntro } from "@/components/nivaran/translated-page-intros";
export default function QueuePage(){return <PortalShell role="reviewer" title="Review complaints"><ReviewerQueueIntro/><ReviewerQueue/></PortalShell>}
