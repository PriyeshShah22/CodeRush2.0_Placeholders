"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, FileCheck2, FlaskConical, Loader2, MapPin, Paperclip, Play, Route, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { API_URL, api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "./language-provider";
import { RecoveryCountdown } from "./recovery-countdown";
import type { NotificationItem } from "./notification-bell";

type Evidence = {
  id: string;
  storage_reference: string;
  mime_type: string;
  size_bytes: number;
  evidence_type: string;
  created_at: string;
  is_resolution_proof: boolean;
};

type TaskData = {
  assignment: { id: string; status: string; kind: string };
  complaint: Complaint;
  dependencies: { id: string }[];
  sla?: { acknowledgement_due_at?: string; resolution_due_at: string; department_breached_at?: string };
  evidence: Evidence[];
};

function localizedComplaint(complaint: Complaint, locale: "en" | "hi" | "mr") {
  if (locale === "hi") return complaint.translation_hi || complaint.normalized_text || complaint.safe_text;
  if (locale === "mr") return complaint.translation_mr || complaint.normalized_text || complaint.safe_text;
  return complaint.normalized_text || complaint.safe_text;
}

export function TaskWorkspace({ id }: { id: string }) {
  const { locale, tr, status, priority, assignment, category, date, location } = useLanguage();
  const [detail, setDetail] = useState<TaskData | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [adminRequests,setAdminRequests]=useState<NotificationItem[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await api<{ data: TaskData }>(`/department/tasks/${id}`);
      setDetail(response.data);
      setError("");
    } catch {
      setError(tr("Task unavailable"));
    } finally {
      setLoading(false);
    }
  }, [id, tr]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    void api<{data:NotificationItem[]}>("/notifications").then(response=>setAdminRequests(response.data.filter(item=>item.kind==="admin_recovery_target"||item.kind==="admin_update_requested"))).catch(()=>setAdminRequests([]));
    return () => window.clearTimeout(timer);
  }, [load]);

  async function simulateBreach(){if(!detail)return;setBusyAction("sla");try{await api(`/complaints/${detail.complaint.id}/sla/simulate`,{method:"POST",body:JSON.stringify({stage:"department"})});toast.success(tr("Department breach sent to Admin"));await load();}catch{toast.error(tr("Simulation failed"));}finally{setBusyAction("");}}

  async function update(next: "acknowledged" | "in_progress" | "resolution_submitted") {
    if (!detail) return;
    const proofs = detail.evidence.filter((item) => item.is_resolution_proof);
    if (next === "resolution_submitted" && !proofs.length) {
      toast.error(tr("Attach proof before submitting completion."));
      return;
    }
    setBusyAction(next);
    try {
      await api(`/department/tasks/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: next, note, expected_version: detail.complaint.version }),
      });
      toast.success(
        next === "acknowledged"
          ? tr("Task acknowledged")
          : next === "in_progress"
            ? tr("Work started")
            : tr("Resolution sent for admin verification"),
      );
      await load();
    } catch {
      toast.error(tr("Update failed"));
    } finally {
      setBusyAction("");
    }
  }

  async function upload(file?: File) {
    if (!file || !detail) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_URL}/complaints/${detail.complaint.id}/evidence`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Assignment-Id": id },
        body,
      });
      if (!response.ok) throw new Error();
      toast.success(tr("Protected completion proof attached"));
      await load();
    } catch {
      toast.error(tr("Evidence upload failed"));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  if (loading)
    return <div className="grid min-h-72 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (!detail)
    return <p className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}</p>;

  const { complaint, assignment: taskAssignment, dependencies, sla, evidence } = detail;
  const proofs = evidence.filter((item) => item.is_resolution_proof);
  const canAddProof = taskAssignment.status === "in_progress";
  const hasRecoveryTarget=adminRequests.some(item=>item.complaint_id===complaint.id&&item.kind==="admin_recovery_target");

  return (
    <div className="mx-auto max-w-6xl">
      {hasRecoveryTarget&&sla?<div className="mb-5"><RecoveryCountdown dueAt={sla.resolution_due_at}/></div>:null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{complaint.reference_number} · {assignment(taskAssignment.kind)}</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-[-.04em]">
            {localizedComplaint(complaint, locale)}
          </h2>
          <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />{location(complaint.location_text)}
          </p>
        </div>
        <Badge>{status(taskAssignment.status)}</Badge>
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_.78fr]">
        <section className="border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-civic" />
            <h3 className="font-bold">{tr("Verified complaint context")}</h3>
          </div>
          <div className="mt-5 grid gap-px border bg-border sm:grid-cols-3">
            <div className="bg-card p-4"><span className="text-xs text-muted-foreground">{tr("Complaint category")}</span><b className="mt-1 block text-sm">{category(complaint.category)}</b></div>
            <div className="bg-card p-4"><span className="text-xs text-muted-foreground">{tr("Approved priority")}</span><b className="mt-1 block text-sm">{priority(complaint.priority)}</b></div>
            <div className="bg-card p-4"><span className="text-xs text-muted-foreground">{tr("Resolution deadline")}</span><b className="mt-1 block text-sm">{sla ? date(sla.resolution_due_at) : tr("Pending review")}</b>{sla?<Button variant="ghost" size="sm" className="mt-2 px-0 text-amber-800 hover:text-amber-900" disabled={Boolean(busyAction)||Boolean(sla.department_breached_at)} onClick={()=>void simulateBreach()}><FlaskConical/>{busyAction==="sla"?tr("Running…"):sla.department_breached_at?tr("Escalated to Admin"):tr("Simulate breach")}</Button>:null}</div>
          </div>
          <div className="mt-5 space-y-5 border p-4 sm:p-5">
            <div>
              <span className="text-xs font-bold text-muted-foreground">{tr("Original resident report")}</span>
              <p className="mt-2 text-sm leading-7">{locale === "en" ? complaint.original_text : localizedComplaint(complaint, locale)}</p>
            </div>
            <div className="border-t pt-4">
              <span className="text-xs font-bold text-muted-foreground">{tr("Service-ready description")}</span>
              <p className="mt-2 text-sm leading-7">{localizedComplaint(complaint, locale)}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border p-4">
              <MapPin className="size-4 text-civic" />
              <span className="mt-3 block text-xs text-muted-foreground">{tr("Reported location")}</span>
              <b className="mt-1 block text-sm">{location(complaint.location_text)}</b>
            </div>
            <div className="border p-4">
              <Route className="size-4 text-civic" />
              <span className="mt-3 block text-xs text-muted-foreground">{tr("Cross-department dependencies")}</span>
              <b className="mt-1 block text-sm">
                {dependencies.length
                  ? tr(dependencies.length === 1 ? "{count} linked task" : "{count} linked tasks", { count: dependencies.length })
                  : tr("No dependency")}
              </b>
            </div>
          </div>

          {taskAssignment.status === "acknowledged" || taskAssignment.status === "in_progress" ? (
            <div className="mt-6">
              <Label htmlFor="note">{tr("Operational note")}</Label>
              <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} className="mt-2" placeholder={tr("Record only service-relevant details…")} />
            </div>
          ) : null}

          <div className="mt-5">
            {taskAssignment.status === "assigned" ? (
              <Button onClick={() => void update("acknowledged")} disabled={Boolean(busyAction)}>
                {busyAction ? <Loader2 className="animate-spin" /> : <Check />}{busyAction ? tr("Acknowledging") : tr("Acknowledge")}
              </Button>
            ) : taskAssignment.status === "acknowledged" ? (
              <Button onClick={() => void update("in_progress")} disabled={Boolean(busyAction)}>
                {busyAction ? <Loader2 className="animate-spin" /> : <Play />}{busyAction ? tr("Starting work") : tr("Start work")}
              </Button>
            ) : taskAssignment.status === "in_progress" ? (
              <Button onClick={() => void update("resolution_submitted")} disabled={Boolean(busyAction) || !proofs.length}>
                {busyAction ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}{busyAction ? tr("Submitting") : tr("Submit for admin verification")}
              </Button>
            ) : taskAssignment.status === "resolution_submitted" ? (
              <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <b>{tr("Waiting for admin verification")}</b>
                <p className="mt-1">{tr("The department has submitted proof. Final resolution is recorded only after admin verification.")}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-bold text-civic"><CheckCircle2 className="size-5" />{status("resolved")}</div>
            )}
          </div>
        </section>

        <aside className="border bg-card p-5 sm:p-6">
          <p className="eyebrow">{tr("Completion proof")}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{tr("Attach a clear site photo or video after the work is complete.")}</p>

          {proofs.length ? (
            <div className="mt-5 space-y-3">
              {proofs.map((proof) => {
                const source = `${API_URL}/evidence/${encodeURIComponent(proof.storage_reference)}`;
                return (
                  <div key={proof.id} className="overflow-hidden border bg-secondary/20">
                    {proof.mime_type.startsWith("image/") ? (
                      <div className="relative aspect-video bg-muted">
                        <Image unoptimized fill sizes="(max-width: 1280px) 100vw, 32vw" className="object-cover" src={source} alt={tr("Completion proof")} />
                      </div>
                    ) : proof.mime_type.startsWith("video/") ? (
                      <video controls className="aspect-video w-full bg-black" src={source} />
                    ) : null}
                    <div className="flex items-center gap-3 p-3">
                      <span className="grid size-8 place-items-center rounded-full bg-civic text-white"><FileCheck2 className="size-4" /></span>
                      <div className="min-w-0"><b className="block text-sm">{tr("Proof attached")}</b><span className="block truncate text-xs text-muted-foreground">{proof.storage_reference}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 border border-dashed p-8 text-center">
              <Paperclip className="mx-auto size-5 text-civic" />
              <b className="mt-3 block text-sm">{tr("Completion proof")}</b>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{tr("JPG, PNG, WebP, MP4, or WebM · protected access")}</p>
            </div>
          )}

          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} />
          {canAddProof ? (
            <Button variant="outline" className="mt-4 w-full" disabled={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}{uploading ? tr("Uploading…") : tr("Select proof")}
            </Button>
          ) : null}
          <p className="mt-5 text-xs leading-5 text-muted-foreground">{tr("Reporter contact details are not exposed in department tasks.")}</p>
        </aside>
      </div>
    </div>
  );
}
