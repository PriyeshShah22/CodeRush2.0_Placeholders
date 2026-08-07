"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock3, Loader2, Route, ShieldCheck, Users } from "lucide-react";
import { PortalShell } from "@/components/nivaran/portal-shell";
import { CorrectionButton } from "@/components/nivaran/correction-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, Complaint } from "@/lib/api";
import { useLanguage } from "@/components/nivaran/language-provider";

type Detail = { complaint: Complaint; routes: { department: string }[]; incident?: { title: string; linked_reports: number; community_confirmations:number; affected_residents:number; clubbed: boolean; match_reasons: Record<string, unknown> }; sla?: { resolution_due_at: string }; timeline: { id: string; action: string; created_at: string; reason?: string }[] };

export default function ResidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() { setLoading(true); setError(""); try { const response = await api<{ data: Detail }>(`/complaints/${id}`); setDetail(response.data); } catch (caught) { setError(caught instanceof Error ? caught.message : "Complaint unavailable"); } finally { setLoading(false); } }
  useEffect(() => { api<{ data: Detail }>(`/complaints/${id}`).then((response) => setDetail(response.data)).catch((caught) => setError(caught instanceof Error ? caught.message : "Complaint unavailable")).finally(() => setLoading(false)); }, [id]);
  return <PortalShell role="resident" title="Complaint status">{loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-civic" /></div> : !detail ? <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-900"><b>Your complaint could not be loaded.</b><p className="mt-2">{error}</p><Button className="mt-4" variant="outline" onClick={load}>Try again</Button></div> : <ComplaintStatus detail={detail} />}</PortalShell>;
}

function ComplaintStatus({ detail }: { detail: Detail }) {
  const { locale }=useLanguage();
  const c = detail.complaint;
  const translated=locale==="hi"&&c.translation_hi?c.translation_hi:locale==="mr"&&c.translation_mr?c.translation_mr:c.normalized_text||c.safe_text;
  const related = Math.max(0, (detail.incident?.linked_reports || 1) - 1);
  return <div className="mx-auto max-w-4xl">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{c.reference_number}</p><h2 className="mt-3 text-3xl font-bold tracking-[-.045em]">Your civic service report</h2><p className="mt-2 text-sm text-muted-foreground">{c.location_text}</p></div><Badge className="capitalize">{c.status.replaceAll("_", " ")}</Badge></div>
    <section className="mt-6 border bg-card p-5"><p className="text-sm leading-7">{translated}</p>{locale!=="en"&&<p className="mt-3 text-xs text-muted-foreground">Translated for your selected interface language.</p>}</section>
    {detail.incident && <section className="mt-6 border border-civic/30 bg-civic/5 p-5"><div className="flex items-start gap-3"><Users className="mt-0.5 size-6 text-civic" /><div><p className="eyebrow">Shared local incident</p><h3 className="mt-2 text-xl font-bold">{detail.incident.affected_residents} residents affected</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{related} other independent report{related===1?"":"s"} and {detail.incident.community_confirmations} nearby “also affected” confirmation{detail.incident.community_confirmations===1?"":"s"} are linked to this incident. Identities remain separate, and a reviewer retains final priority control.</p></div></div></section>}
    <div className="mt-7 grid gap-4 md:grid-cols-3"><div className="border bg-card p-5"><Route className="size-5 text-civic" /><span className="mt-5 block text-xs text-muted-foreground">{c.status === "assigned" ? "Assigned services" : "AI-recommended services"}</span><b className="mt-1 block">{detail.routes.length ? detail.routes.map((route) => route.department).join(" + ") : "Awaiting human review"}</b>{!c.routing_approved && <small className="mt-2 block text-muted-foreground">A reviewer must approve these before assignment.</small>}</div><div className="border bg-card p-5"><Clock3 className="size-5 text-civic" /><span className="mt-5 block text-xs text-muted-foreground">{c.routing_approved ? "Service-rule window" : "Provisional service-rule window"}</span><b className="mt-1 block">{detail.sla?.resolution_due_at ? new Date(detail.sla.resolution_due_at).toLocaleString() : "Set after service-rule review"}</b></div><div className="border bg-card p-5"><ShieldCheck className="size-5 text-civic" /><span className="mt-5 block text-xs text-muted-foreground">Something looks wrong?</span><CorrectionButton complaintId={c.id} /></div></div>
    <section className="mt-7 border bg-card p-6"><h3 className="text-xl font-bold">Service timeline</h3>{detail.timeline.length ? <ol className="mt-6 space-y-0">{[...detail.timeline].reverse().map((event, index) => <li key={event.id} className="relative border-l pb-7 pl-7 last:pb-0"><span className={`absolute -left-2 top-0 size-4 rounded-full border-4 border-card ${index === detail.timeline.length - 1 ? "bg-amber-500" : "bg-civic"}`} /><div className="flex flex-wrap justify-between gap-2"><b className="capitalize">{event.action.replaceAll("_", " ")}</b><time className="font-mono text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</time></div>{event.reason && ["resident_review_requested", "sla_breached"].includes(event.action) && <p className="mt-1 text-sm text-muted-foreground">{event.reason}</p>}</li>)}</ol> : <p className="mt-5 text-sm text-muted-foreground">The first processing update will appear here shortly.</p>}</section>
    <div className="mt-5 flex items-start gap-3 bg-civic/5 p-4 text-sm"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-civic" /><p>This status is visible only inside your signed-in account. Other residents never see your identity or exact coordinates.</p></div>
  </div>;
}
