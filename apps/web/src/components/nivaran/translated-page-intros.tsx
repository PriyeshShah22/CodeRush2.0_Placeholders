"use client";

import { useLanguage } from "./language-provider";

export function AdminPageIntro() {
  const { tr } = useLanguage();
  return <div className="mb-6"><p className="eyebrow">{tr("Live municipal workflow")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">{tr("One accountable view")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{tr("Incident totals, service deadlines, and complaint locations are calculated directly from persisted workflow records.")}</p></div>;
}

export function DepartmentPageIntro() {
  const { tr } = useLanguage();
  return <div className="mb-5"><p className="eyebrow">{tr("Persisted assignments")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">{tr("Priority work")}</h2><p className="mt-2 text-sm text-muted-foreground">{tr("Only tasks assigned to the signed-in department appear here, with the approved priority and resolution deadline.")}</p></div>;
}

export function DepartmentQueueIntro() {
  const { tr } = useLanguage();
  return <div className="mb-6"><p className="eyebrow">{tr("Department task queue")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">{tr("Operational queue")}</h2></div>;
}

export function ReviewerPageIntro() {
  const { tr } = useLanguage();
  return <div className="mb-5"><p className="eyebrow">{tr("Human decision gate")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">{tr("Complaints awaiting reviewer approval")}</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{tr("AI recommends category and priority. Review, edit if needed, and explicitly approve before any department assignment.")}</p></div>;
}

export function ReviewerQueueIntro() {
  const { tr } = useLanguage();
  return <div className="mb-6"><p className="eyebrow">{tr("Persisted cases")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">{tr("Review queue")}</h2><p className="mt-2 text-sm text-muted-foreground">{tr("Recommendations remain suggestions until an authorized reviewer confirms the handoff.")}</p></div>;
}

export function AdminDepartmentsIntro() {
  const { tr } = useLanguage();
  return <div className="mb-6"><p className="eyebrow">{tr("Department directory")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">{tr("Configured municipal services")}</h2><p className="mt-2 text-sm text-muted-foreground">{tr("Manage the departments eligible for reviewer routing.")}</p></div>;
}

export function AuditPageIntro() {
  const { tr } = useLanguage();
  return <div className="mb-6"><p className="eyebrow">{tr("Decision provenance")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">{tr("Who changed what—and why")}</h2></div>;
}
