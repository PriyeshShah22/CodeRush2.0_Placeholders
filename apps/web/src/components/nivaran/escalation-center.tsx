"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BellRing, Clock3, FlaskConical, Loader2, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Row = {
  complaint: Complaint;
  sla: { risk_score: number; breached_at?: string; review_due_at?: string; review_breached_at?: string; department_breached_at?: string; acknowledgement_due_at: string; resolution_due_at: string; escalation_level: number };
  admin_action?: { action: string; note?: string; created_at: string };
};

export function EscalationCenter() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string>();
  const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try { setRows((await api<{ data: Row[] }>("/admin/escalations")).data); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Escalations unavailable"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    api<{ data: Row[] }>("/admin/escalations")
      .then((response) => setRows(response.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Escalations unavailable"))
      .finally(() => setLoading(false));
  }, []);
  async function act(id: string, action: "request_update" | "recovery_target") {
    setRunning(`${id}:${action}`);
    try {
      const response = await api<{ message: string }>(`/admin/escalations/${id}/action`, { method: "POST", body: JSON.stringify({ action, recovery_hours: 2 }) });
      if (action === "recovery_target") {
        const stored = JSON.parse(localStorage.getItem("nivaran-recovery-targets") || "{}") as Record<string, string>;
        localStorage.setItem("nivaran-recovery-targets", JSON.stringify({ ...stored, [id]: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() }));
      }
      toast.success(response.message); await load();
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Action failed"); }
    finally { setRunning(undefined); }
  }
  async function simulate(id: string) {
    setRunning(`${id}:simulate`);
    try { await api(`/admin/escalations/${id}/simulate`, { method: "POST" }); toast.success("Breach added to the Admin action queue"); await load(); }
    catch (caught) { toast.error(caught instanceof Error ? caught.message : "Simulation failed"); }
    finally { setRunning(undefined); }
  }
  if (loading) return <div className="mt-7 grid min-h-48 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (error) return <p className="mt-7 border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>;
  return <div><div><p className="eyebrow">Admin action queue</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">SLA breaches</h2><p className="mt-2 text-sm text-muted-foreground">Every review or department breach is sent here for an accountable response.</p></div>{!rows.length ? <p className="mt-7 border bg-card p-8 text-center text-sm text-muted-foreground">No service windows are currently at risk.</p> : <div className="mt-7 divide-y border bg-card">{rows.map(({ complaint, sla, admin_action: action }) => { const stage = sla.review_breached_at ? "Human review" : sla.department_breached_at ? "Department" : "At risk"; const breached = Boolean(sla.breached_at); return <article key={complaint.id} className="grid items-center gap-4 p-5 xl:grid-cols-[1.1fr_.7fr_.7fr_auto]"><div><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-800" /><b className="font-mono text-sm">{complaint.reference_number}</b></div><p className="mt-2 text-sm">{complaint.title || complaint.normalized_text || complaint.category}</p></div><div><span className="text-xs text-muted-foreground">Breach type</span><b className="mt-1 flex items-center gap-1 text-sm"><Clock3 className="size-3" />{breached ? `${stage} · level ${sla.escalation_level}` : `Risk ${Math.round(sla.risk_score * 100)}%`}</b><small className="mt-1 block text-muted-foreground">{stage === "Human review" ? `Review deadline: ${new Date(sla.review_due_at || sla.acknowledgement_due_at).toLocaleString()}` : `Resolution deadline: ${new Date(sla.resolution_due_at).toLocaleString()}`}</small></div><div>{action ? <><Badge variant="secondary">Admin action recorded</Badge><small className="mt-2 block text-xs text-muted-foreground">{action.note}</small></> : <Badge variant={breached ? "destructive" : "outline"}>{breached ? "Action required" : "Monitor"}</Badge>}</div><div className="flex flex-wrap gap-2">{breached ? <><Button size="sm" variant="outline" disabled={Boolean(running)} onClick={() => void act(complaint.id,"request_update")}><BellRing />{running === `${complaint.id}:request_update` ? "Sending…" : "Request update"}</Button><Button size="sm" disabled={Boolean(running)} onClick={() => void act(complaint.id,"recovery_target")}><TimerReset />{running === `${complaint.id}:recovery_target` ? "Setting…" : "Set 2h target"}</Button></> : <Button size="sm" onClick={() => void simulate(complaint.id)} disabled={Boolean(running)}><FlaskConical />Simulate breach</Button>}</div></article>; })}</div>}</div>;
}
