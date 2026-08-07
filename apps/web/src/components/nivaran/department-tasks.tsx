"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FlaskConical, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecoveryCountdown } from "@/components/nivaran/recovery-countdown";
type Task = {
  assignment: { id: string; kind: string; status: string; assigned_at: string };
  complaint: Complaint;
  sla?: { resolution_due_at: string; department_breached_at?: string };
};
type Notification = { complaint_id?: string; kind: string };
export function DepartmentTasks({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<Task[]>([]);
  const [recoveryTargets, setRecoveryTargets] = useState<Notification[]>([]);
  const [localRecoveryIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return Object.keys(JSON.parse(localStorage.getItem("nivaran-recovery-targets") || "{}") as Record<string, string>); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [running, setRunning] = useState<string>();
  async function simulate(complaintId: string) {
    setRunning(complaintId);
    try {
      await api(`/complaints/${complaintId}/sla/simulate`, { method: "POST", body: JSON.stringify({ stage: "department" }) });
      setRows((current) => current.map((row) => row.complaint.id === complaintId ? { ...row, complaint: { ...row.complaint, status: "escalated" }, sla: row.sla ? { ...row.sla, department_breached_at: new Date().toISOString() } : row.sla } : row));
      toast.success("Department breach sent to Admin");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Simulation failed");
    } finally { setRunning(undefined); }
  }
  useEffect(() => {
    api<{ data: Task[] }>("/department/tasks")
      .then((response) => setRows(response.data))
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Tasks unavailable",
        ),
      )
      .finally(() => setLoading(false));
    api<{ data: Notification[] }>("/notifications")
      .then((response) => setRecoveryTargets(response.data.filter((item) => item.kind === "admin_recovery_target")))
      .catch(() => setRecoveryTargets([]));
  }, []);
  if (loading)
    return (
      <div className="grid min-h-40 place-items-center border bg-card">
        <Loader2 className="animate-spin text-civic" />
      </div>
    );
  if (error)
    return (
      <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        {error}
      </p>
    );
  if (!rows.length)
    return (
      <p className="border bg-card p-8 text-center text-sm text-muted-foreground">
        No persisted tasks are assigned to this department.
      </p>
    );
  const recoveryTaskIds = new Set([...recoveryTargets.map((item) => item.complaint_id), ...localRecoveryIds]);
  const urgentTasks = rows.filter((row) => recoveryTaskIds.has(row.complaint.id) && row.sla);
  return (
    <div className="space-y-3">
      {urgentTasks.length ? <section className="border-2 border-amber-400 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-950">Urgent admin recovery targets</p><p className="mt-1 text-sm text-amber-950">These delayed complaints have a recovery deadline set by Admin.</p><div className="mt-3 grid gap-2">{urgentTasks.map(({ assignment, complaint, sla }) => <Link key={assignment.id} href={`/department/tasks/${assignment.id}`} className="flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-white px-3 py-2 hover:bg-amber-100"><span><b className="font-mono text-sm">{complaint.reference_number}</b><span className="ml-2 text-sm">{complaint.title || complaint.normalized_text || complaint.category}</span></span><RecoveryCountdown dueAt={sla!.resolution_due_at} compact /></Link>)}</div></section> : null}
      {rows.slice(0, compact ? 4 : 20).map(({ assignment, complaint, sla }) => (
        <article
          key={assignment.id}
          className="hover-lift hover-arrow grid items-center gap-4 border bg-card p-5 md:grid-cols-[1.2fr_.6fr_.6fr_auto]"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-civic">
                {complaint.reference_number}
              </span>
              <Badge variant="outline" className="capitalize">
                {assignment.kind}
              </Badge>
              <Badge
                variant={
                  complaint.priority === "critical"
                    ? "destructive"
                    : "secondary"
                }
                className="capitalize"
              >
                {complaint.priority} priority
              </Badge>
            </div>
            <h3 className="mt-2 font-bold">
              {complaint.title ||
                complaint.normalized_text ||
                complaint.category}
            </h3>
            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {complaint.location_text}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Task state</span>
            <b className="mt-1 block text-sm capitalize">
              {assignment.status.replaceAll("_", " ")}
            </b>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">
              Resolution deadline
            </span>
            <b className="mt-1 block text-sm">
              {sla
                ? new Date(sla.resolution_due_at).toLocaleString()
                : "Pending review"}
            </b>
            {sla && recoveryTaskIds.has(complaint.id) ? <div className="mt-1"><RecoveryCountdown dueAt={sla.resolution_due_at} compact /></div> : null}
          </div>
          <div className="flex items-center gap-1"><Button size="sm" variant="ghost" title="Simulate department SLA breach" disabled={Boolean(running) || Boolean(sla?.department_breached_at)} onClick={() => void simulate(complaint.id)}><FlaskConical /><span className="hidden xl:inline">SLA demo</span></Button><Button asChild variant="outline" size="sm"><Link href={`/department/tasks/${assignment.id}`}>Open <ArrowRight /></Link></Button></div>
        </article>
      ))}
    </div>
  );
}
