"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Check, History, Loader2, LockKeyhole, MapPin, Pencil, Route, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type RouteOption = { department_id: string; department: string; factors: Record<string, number>; rank: number };
type Detail = {
  complaint: Complaint;
  analysis?: { entities: Record<string, string>; clarification_questions: string[] };
  incident?: { id: string; title: string; linked_reports: number; match_reasons: Record<string, unknown>; clubbed: boolean };
  routes: RouteOption[];
  sla?: { resolution_due_at: string; risk_score: number };
};

const reasons = ["incorrect category", "incorrect jurisdiction", "multiple departments involved", "missing context", "policy exception"];

export function ReviewerWorkspace({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("normal");
  const [location, setLocation] = useState("");
  const [ward, setWard] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api<{ data: Detail }>(`/complaints/${id}`);
      setDetail(response.data);
      const complaint = response.data.complaint;
      setCategory(complaint.category || "other");
      setPriority(complaint.priority);
      setLocation(complaint.location_text);
      setWard(complaint.ward || "");
      setSelected(response.data.routes.map((route) => route.department_id).slice(0, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This complaint could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api<{ data: Detail }>(`/complaints/${id}`).then((response) => {
      setDetail(response.data);
      const complaint = response.data.complaint;
      setCategory(complaint.category || "other"); setPriority(complaint.priority); setLocation(complaint.location_text); setWard(complaint.ward || "");
      setSelected(response.data.routes.map((route) => route.department_id).slice(0, 2));
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "This complaint could not be loaded.")).finally(() => setLoading(false));
  }, [id]);

  const changed = useMemo(() => detail ? category !== (detail.complaint.category || "other") || priority !== detail.complaint.priority || location !== detail.complaint.location_text || ward !== (detail.complaint.ward || "") : false, [category, priority, location, ward, detail]);

  async function approveDecision() {
    if (!detail) return;
    if (changed && !reason) {
      toast.error("Select a reason for changing the AI recommendation.");
      return;
    }
    setSaving(true);
    try {
      const response = await api<{ data: Complaint }>(`/reviewer/complaints/${detail.complaint.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ category, priority, location_text: location, ward: ward || null, reason_code: changed ? reason : null, note: note || null, expected_version: detail.complaint.version }),
      });
      setDetail((current) => current ? { ...current, complaint: response.data } : current);
      setOpen(false);
      toast.success(changed ? "Changes and approval recorded in the audit trail." : "AI priority and routing approved by reviewer.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Review could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function toggleDepartment(departmentId: string) {
    setSelected((current) => current.includes(departmentId) ? current.filter((item) => item !== departmentId) : [...current, departmentId]);
  }

  async function assign() {
    if (!detail || selected.length === 0) return;
    setSaving(true);
    try {
      await api(`/reviewer/complaints/${detail.complaint.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ primary_department_id: selected[0], supporting_department_ids: selected.slice(1), expected_version: detail.complaint.version }),
      });
      setDetail((current) => current ? { ...current, complaint: { ...current.complaint, status: "assigned", version: current.complaint.version + 1 } } : current);
      toast.success(`${selected.length} department${selected.length > 1 ? "s" : ""} assigned with one accountable primary owner.`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Assignment failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid min-h-72 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (!detail) return <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-900"><b>Complaint unavailable.</b><p className="mt-2">{error}</p><Button variant="outline" className="mt-4" onClick={load}>Try again</Button></div>;
  const c = detail.complaint;

  return <div>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div><div className="flex items-center gap-2"><span className="eyebrow">{c.reference_number}</span><Badge variant="outline" className="capitalize">{c.status.replaceAll("_", " ")}</Badge></div><h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">Verify the decision before the handoff.</h2></div>
      <div className="flex flex-wrap items-center gap-2"><Badge variant="outline"><History /> Audit recording on</Badge><Button onClick={assign} disabled={saving || !["awaiting_review", "reopened"].includes(c.status) || !c.priority_reviewed || !c.routing_approved || selected.length === 0}><Check />{c.status === "assigned" ? "Assigned" : !["awaiting_review", "reopened"].includes(c.status) ? "Assignment unavailable" : `Assign ${selected.length || ""} department${selected.length === 1 ? "" : "s"}`}</Button></div>
    </div>

    {!c.priority_reviewed && <div className="mb-4 flex items-start gap-3 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><b>Human approval required.</b><p className="mt-1">AI has recommended the priority and eligible routes. Nothing can be assigned until a reviewer approves or edits the decision.</p></div></div>}
    {detail.incident?.clubbed && <div className="mb-4 flex items-center gap-3 border border-civic/30 bg-civic/5 p-4 text-sm"><Users className="size-5 text-civic" /><div><b>Clubbed incident · +{Math.max(0, detail.incident.linked_reports - 1)} related resident report{detail.incident.linked_reports === 2 ? "" : "s"}</b><p className="mt-1 text-muted-foreground">{Object.entries(detail.incident.match_reasons).filter(([, value]) => value !== null && value !== false).map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join(" · ")}</p></div></div>}

    <div className="grid overflow-hidden border bg-card xl:grid-cols-[1.04fr_.96fr_1fr]">
      <section className="border-b p-5 xl:border-r xl:border-b-0">
        <div className="flex items-center justify-between"><p className="eyebrow">Resident report</p><Badge variant="secondary" className="capitalize">{c.source_channel}</Badge></div>
        <h3 className="mt-5 text-lg font-bold">Original</h3><p className="mt-3 text-sm leading-7">{c.original_text}</p>
        <div className="mt-5 bg-ink p-4 text-white"><div className="flex items-center gap-2 text-xs font-bold text-emerald-300"><LockKeyhole className="size-4" />Privacy-safe operational text</div><p className="mt-3 text-sm leading-6 text-white/80">{c.safe_text}</p></div>
        <div className="mt-5"><p className="text-xs font-bold uppercase tracking-wider">Normalized translation</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{c.normalized_text || "Translation is still being processed; review the original text."}</p></div>
        <div className="mt-5 flex items-center gap-3 border-t pt-4 text-sm"><MapPin className="size-4 text-civic" /><span><b>{c.location_text}</b><small className="block text-muted-foreground">{c.ward || "Ward needs reviewer confirmation"}</small></span></div>
      </section>

      <section className="border-b p-5 xl:border-r xl:border-b-0">
        <div className="flex items-center justify-between"><p className="eyebrow">AI recommendation</p><Badge variant={c.priority_reviewed ? "secondary" : "outline"}>{c.priority_reviewed ? "Human approved" : "Awaiting approval"}</Badge></div>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">Decision support only. Reviewers own the final category, priority, location, and department handoff.</p>
        <div className="mt-4 grid grid-cols-2 gap-px border bg-border"><div className="bg-card p-3"><span className="text-xs text-muted-foreground">Category</span><strong className="mt-1 block capitalize">{c.category || "Unclassified"}</strong></div><div className="bg-card p-3"><span className="text-xs text-muted-foreground">Priority</span><strong className="mt-1 block capitalize text-amber-800">{c.priority}</strong></div><div className="col-span-2 bg-card p-3"><span className="text-xs text-muted-foreground">Why</span><p className="mt-1 text-sm leading-5">{c.ai_explanation || "AI processing unavailable; decide manually."}</p></div></div>
        <div className="mt-5"><h3 className="text-xs font-bold uppercase tracking-wider">Extracted facts</h3>{Object.keys(detail.analysis?.entities || {}).length ? <dl className="mt-3 divide-y border">{Object.entries(detail.analysis?.entities || {}).map(([key, value]) => <div key={key} className="flex justify-between gap-3 p-3 text-sm"><dt className="text-muted-foreground">{key.replaceAll("_", " ")}</dt><dd className="text-right font-semibold">{String(value)}</dd></div>)}</dl> : <p className="mt-3 border p-3 text-sm text-muted-foreground">No structured facts were extracted. Review manually.</p>}</div>
      </section>

      <section className="p-5">
        <div className="flex items-center justify-between"><p className="eyebrow">Eligible departments</p><Route className="size-4 text-civic" /></div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Select one primary owner first, then any supporting departments. Eligibility comes from configured service rules.</p>
        <div className="mt-5 space-y-3">{detail.routes.length ? detail.routes.map((route) => <label key={route.department_id} className={`flex cursor-pointer items-start gap-3 border p-4 ${selected.includes(route.department_id) ? "border-civic bg-civic/5" : ""}`}><Checkbox checked={selected.includes(route.department_id)} onCheckedChange={() => toggleDepartment(route.department_id)} /><span className="min-w-0"><b className="flex items-center gap-2"><Building2 className="size-4" />{route.department}</b><span className="mt-2 block text-xs leading-5 text-muted-foreground">{Object.keys(route.factors).map((factor) => factor.replaceAll("_", " ")).join(" · ")}</span>{selected[0] === route.department_id && <Badge className="mt-2">Primary owner</Badge>}</span></label>) : <p className="border p-4 text-sm text-muted-foreground">No eligible route was produced. Edit the category or send this case for service-rule configuration.</p>}</div>

        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" className="mt-5 w-full"><Pencil />Review / edit complaint</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Review AI triage</DialogTitle><DialogDescription>Accept it as shown, or edit it with a recorded reason. Approval is mandatory before assignment.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{["roads", "water", "drainage", "sanitation", "streetlight", "electrical_hazard", "trees", "flooding", "accessibility", "public_infrastructure", "public_safety", "other"].map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></div><div><Label>Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{["low", "normal", "high", "critical"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div><Label>Verified location</Label><Input className="mt-2" value={location} onChange={(event) => setLocation(event.target.value)} /></div><div><Label>Ward</Label><Input className="mt-2" value={ward} onChange={(event) => setWard(event.target.value)} /></div></div>{changed && <div><Label>Reason for change</Label><Select value={reason} onValueChange={setReason}><SelectTrigger className="mt-2 w-full"><SelectValue placeholder="Choose an auditable reason" /></SelectTrigger><SelectContent>{reasons.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>}<div><Label>Reviewer note</Label><Textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-2" placeholder="Evidence or context behind this decision" /></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={approveDecision} disabled={saving}>{saving && <Loader2 className="animate-spin" />}{changed ? "Save changes & approve" : "Approve recommendation"}</Button></DialogFooter></DialogContent></Dialog>
        <p className="mt-4 flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />Only configured departments can be assigned, and every decision is auditable.</p>
      </section>
    </div>
  </div>;
}
