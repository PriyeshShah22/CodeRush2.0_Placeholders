"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BellRing, Clock3, FlaskConical, Loader2, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";

type Row = {
  complaint: Complaint;
  sla: { risk_score: number; breached_at?: string; review_due_at?: string; review_breached_at?: string; department_breached_at?: string; resolution_due_at: string; escalation_level: number };
  admin_action?: { action: string; note?: string; created_at: string };
};

export function EscalationCenter() {
  const { locale, tr, status } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string>();
  const [error, setError] = useState("");
  const load=useCallback(async () => {
    setLoading(true); setError("");
    try { setRows((await api<{ data: Row[] }>("/admin/escalations")).data); }
    catch { setError(tr("Escalations unavailable")); }
    finally { setLoading(false); }
  },[tr]);
  useEffect(() => { const timer=setTimeout(()=>void load(),0); return ()=>clearTimeout(timer); }, [load]);
  async function simulate(id: string) {
    setRunning(`${id}:simulate`);
    try { await api(`/admin/escalations/${id}/simulate`, { method: "POST" }); toast.success(tr("Breach processed through SLA, notification, and audit workflows")); await load(); }
    catch { toast.error(tr("Simulation failed")); }
    finally { setRunning(undefined); }
  }
  async function act(id: string, action: "request_update" | "recovery_target") {
    setRunning(`${id}:${action}`);
    try { const response=await api<{message:string}>(`/admin/escalations/${id}/action`,{method:"POST",body:JSON.stringify({action,recovery_hours:2})}); toast.success(response.message); await load(); }
    catch { toast.error(tr("Action failed")); }
    finally { setRunning(undefined); }
  }
  if (loading) return <div className="mt-7 grid min-h-48 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (error) return <p className="mt-7 border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>;
  return <div><div><p className="eyebrow">{tr("Admin action queue")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">{tr("SLA command center")}</h2><p className="mt-2 text-sm text-muted-foreground">{tr("Every review or department breach is sent here for an accountable response.")}</p></div>{!rows.length ? <p className="mt-7 border bg-card p-8 text-center text-sm text-muted-foreground">{tr("No service windows are currently at risk.")}</p> : <div className="mt-7 divide-y border bg-card">{rows.map(({complaint,sla,admin_action})=>{const copy=locale==="hi"?complaint.translation_hi:locale==="mr"?complaint.translation_mr:complaint.title||complaint.normalized_text; const breached=Boolean(sla.breached_at); const stage=sla.review_breached_at?tr("Human review"):sla.department_breached_at?tr("Department"):tr("At risk"); return <article key={complaint.id} className="grid items-center gap-4 p-5 xl:grid-cols-[1.1fr_.7fr_.6fr_auto]"><div><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-800"/><b className="font-mono text-sm">{complaint.reference_number}</b></div><p className="mt-2 text-sm">{copy||tr("Civic service complaint")}</p></div><div><span className="text-xs text-muted-foreground">{tr("SLA state")}</span><b className="mt-1 flex items-center gap-1 text-sm"><Clock3 className="size-3"/>{breached?tr("{stage} · level {level}",{stage,level:sla.escalation_level}):tr("Risk {risk}%",{risk:Math.round(sla.risk_score*100)})}</b></div><div>{admin_action?<><Badge variant="secondary">{tr("Admin action recorded")}</Badge><small className="mt-2 block text-xs text-muted-foreground">{admin_action.note}</small></>:<Badge variant={breached?"destructive":"outline"}>{breached?tr("Action required"):status(complaint.status)}</Badge>}</div><div className="flex flex-wrap gap-2">{breached?<><Button size="sm" variant="outline" disabled={Boolean(running)} onClick={()=>void act(complaint.id,"request_update")}><BellRing/>{tr("Request update")}</Button><Button size="sm" disabled={Boolean(running)} onClick={()=>void act(complaint.id,"recovery_target")}><TimerReset/>{tr("Set 2h target")}</Button></>:<Button size="sm" disabled={Boolean(running)} onClick={()=>void simulate(complaint.id)}><FlaskConical/>{tr("Simulate breach")}</Button>}</div></article>;})}</div>}</div>;
}
