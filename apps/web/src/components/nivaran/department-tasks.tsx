"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";

type Task = {
  assignment: { id: string; kind: string; status: string; assigned_at: string };
  complaint: Complaint;
  sla?: { resolution_due_at: string };
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
    return () => window.clearTimeout(timer);
  }, [load]);

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

  return (
    <div className="space-y-3">
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
            </div>
            {taskAssignment.status === "assigned" ? (
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
            )}
          </article>
        );
      })}
    </div>
  );
}
