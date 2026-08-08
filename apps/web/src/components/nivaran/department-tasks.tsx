"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, FlaskConical, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";
import { RecoveryCountdown } from "./recovery-countdown";
import type { NotificationItem } from "./notification-bell";

type Task = {
  assignment: { id: string; kind: string; status: string; assigned_at: string };
  complaint: Complaint;
  sla?: { resolution_due_at: string; department_breached_at?: string };
};

function complaintCopy(complaint: Complaint, locale: "en" | "hi" | "mr") {
  if (locale === "hi") return complaint.translation_hi || complaint.normalized_text || complaint.safe_text;
  if (locale === "mr") return complaint.translation_mr || complaint.normalized_text || complaint.safe_text;
  return complaint.normalized_text || complaint.safe_text;
}

export function DepartmentTasks({ compact = false }: { compact?: boolean }) {
  const { locale, tr, status, priority, assignment, date, location } = useLanguage();
  const [rows, setRows] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [simulating,setSimulating]=useState("");
  const [recoveryTargets,setRecoveryTargets]=useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await api<{ data: Task[] }>("/department/tasks");
      setRows(response.data);
      setError("");
    } catch {
      setError(tr("Tasks unavailable"));
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    void api<{data:NotificationItem[]}>("/notifications").then(response=>setRecoveryTargets(response.data.filter(item=>item.kind==="admin_recovery_target"))).catch(()=>setRecoveryTargets([]));
    return () => window.clearTimeout(timer);
  }, [load]);

  async function simulate(complaintId:string){setSimulating(complaintId);try{await api(`/complaints/${complaintId}/sla/simulate`,{method:"POST",body:JSON.stringify({stage:"department"})});toast.success(tr("Department breach sent to Admin"));await load();}catch{toast.error(tr("Simulation failed"));}finally{setSimulating("");}}

  async function acknowledge(task: Task) {
    setBusyId(task.assignment.id);
    try {
      await api(`/department/tasks/${task.assignment.id}/status`, {
        method: "POST",
        body: JSON.stringify({
          status: "acknowledged",
          expected_version: task.complaint.version,
        }),
      });
      toast.success(tr("Task acknowledged"));
      await load();
    } catch {
      toast.error(tr("Update failed"));
    } finally {
      setBusyId("");
    }
  }

  if (loading)
    return (
      <div className="grid min-h-40 place-items-center border bg-card">
        <Loader2 className="animate-spin text-civic" />
      </div>
    );
  if (error)
    return <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>;
  if (!rows.length)
    return (
      <p className="border bg-card p-8 text-center text-sm text-muted-foreground">
        {tr("No persisted tasks are assigned to this department.")}
      </p>
    );

  const recoveryIds=new Set(recoveryTargets.map(item=>item.complaint_id));
  const urgentTasks=rows.filter(row=>row.sla&&recoveryIds.has(row.complaint.id));
  return (
    <div className="space-y-3">
      {urgentTasks.length?<section className="border-2 border-amber-400 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-950">{tr("Urgent admin recovery targets")}</p><p className="mt-1 text-sm text-amber-950">{tr("These delayed complaints have a recovery deadline set by Admin.")}</p><div className="mt-3 grid gap-2">{urgentTasks.map(({assignment:taskAssignment,complaint,sla})=><Link key={taskAssignment.id} href={`/department/tasks/${taskAssignment.id}`} className="flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-white px-3 py-2 hover:bg-amber-100"><span><b className="font-mono text-sm">{complaint.reference_number}</b><span className="ml-2 text-sm">{complaintCopy(complaint,locale)}</span></span><RecoveryCountdown dueAt={sla!.resolution_due_at} compact/></Link>)}</div></section>:null}
      {rows.slice(0, compact ? 4 : 20).map((task) => {
        const { assignment: taskAssignment, complaint, sla } = task;
        const isBusy = busyId === taskAssignment.id;
        return (
          <article
            key={taskAssignment.id}
            className="hover-lift hover-arrow grid items-center gap-4 border bg-card p-5 md:grid-cols-[1.2fr_.55fr_.65fr_auto]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-civic">{complaint.reference_number}</span>
                <Badge variant="outline">{assignment(taskAssignment.kind)}</Badge>
                <Badge variant={complaint.priority === "critical" ? "destructive" : "secondary"}>
                  {priority(complaint.priority)}
                </Badge>
              </div>
              <h3 className="mt-2 line-clamp-2 font-bold">{complaintCopy(complaint, locale)}</h3>
              <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {location(complaint.location_text)}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{tr("Task state")}</span>
              <b className="mt-1 block text-sm">{status(taskAssignment.status)}</b>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{tr("Resolution deadline")}</span>
              <b className="mt-1 block text-sm">{sla ? date(sla.resolution_due_at) : tr("Pending review")}</b>
              {sla&&recoveryIds.has(complaint.id)?<div className="mt-1"><RecoveryCountdown dueAt={sla.resolution_due_at} compact/></div>:null}
            </div>
            <div className="flex items-center gap-1"><Button size="sm" variant="ghost" disabled={Boolean(simulating)||Boolean(sla?.department_breached_at)} onClick={()=>void simulate(complaint.id)} title={tr("Simulate department SLA breach")}><FlaskConical/>{simulating===complaint.id?tr("Running…"):sla?.department_breached_at?tr("Escalated"):tr("SLA demo")}</Button>{taskAssignment.status === "assigned" ? (
              <Button size="sm" onClick={() => void acknowledge(task)} disabled={isBusy}>
                {isBusy ? <Loader2 className="animate-spin" /> : <Check />}
                {isBusy ? tr("Acknowledging") : tr("Acknowledge")}
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={`/department/tasks/${taskAssignment.id}`}>
                  {tr("Open")} <ArrowRight />
                </Link>
              </Button>
            )}</div>
          </article>
        );
      })}
    </div>
  );
}
