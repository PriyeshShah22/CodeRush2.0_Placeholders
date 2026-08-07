import { PortalShell } from "@/components/nivaran/portal-shell";import { ReviewerQueue } from "@/components/nivaran/reviewer-queue";
import { ReviewerPageIntro } from "@/components/nivaran/translated-page-intros";
export default function ReviewerPage(){return <PortalShell role="reviewer" title="Review overview"><ReviewerPageIntro/><ReviewerQueue/></PortalShell>}
