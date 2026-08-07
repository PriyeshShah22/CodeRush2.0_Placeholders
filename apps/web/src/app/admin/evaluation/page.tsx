import { PortalShell } from "@/components/nivaran/portal-shell";import { EvaluationView } from "@/components/nivaran/evaluation-view";
export default function EvaluationPage(){return <PortalShell role="admin" title="Evaluation"><div className="mb-6"><p className="eyebrow">Synthetic evaluation · reproducible seed</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Quality and fairness evidence</h2></div><EvaluationView/></PortalShell>}

