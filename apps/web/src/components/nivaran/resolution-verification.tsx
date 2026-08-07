"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, FileCheck2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { API_URL, api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "./language-provider";

type Proof = { id: string; storage_reference: string; mime_type: string; size_bytes: number; evidence_type: string; created_at: string };
type Submission = {
  assignment: { id: string; kind: string; status: string };
  complaint: Complaint;
  department: { id: string; code: string; name: string };
  proofs: Proof[];
};

function complaintCopy(complaint: Complaint, locale: "en" | "hi" | "mr") {
  if (locale === "hi") return complaint.translation_hi || complaint.normalized_text || complaint.safe_text;
  if (locale === "mr") return complaint.translation_mr || complaint.normalized_text || complaint.safe_text;
  return complaint.normalized_text || complaint.safe_text;
}

export function ResolutionVerification() {
  const { locale, tr, priority, category, department, location } = useLanguage();
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api<{ data: Submission[] }>("/admin/resolutions");
      setRows(response.data);
      setError("");
    } catch {
      setError(tr("Resolution verification unavailable"));
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function confirm(item: Submission) {
    setBusyId(item.assignment.id);
    try {
      await api(`/admin/resolutions/${item.assignment.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ expected_version: item.complaint.version }),
      });
      toast.success(tr("Resolution verified"));
      setRows((current) => current.filter((row) => row.assignment.id !== item.assignment.id));
      window.dispatchEvent(new Event("nivaran-workflow-updated"));
    } catch {
      toast.error(tr("Update failed"));
      await load();
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="mb-7 border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b p-5">
        <div>
          <p className="eyebrow">{tr("Resolution verification")}</p>
          <h3 className="mt-2 text-xl font-bold">{tr("Completion submissions")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Verify department proof before closing a resident complaint.")}</p>
        </div>
        <Badge variant={rows.length ? "default" : "outline"}>{rows.length}</Badge>
      </div>
      {loading ? (
        <div className="grid min-h-32 place-items-center"><Loader2 className="animate-spin text-civic" /></div>
      ) : error ? (
        <p className="m-4 border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>
      ) : !rows.length ? (
        <div className="flex items-center justify-center gap-2 p-7 text-sm text-muted-foreground"><CheckCircle2 className="size-5 text-civic" />{tr("No resolutions are waiting for verification.")}</div>
      ) : (
        <div className="divide-y">
          {rows.map((item) => (
            <article key={item.assignment.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-civic">{item.complaint.reference_number}</span>
                  <Badge variant="outline">{priority(item.complaint.priority)}</Badge>
                  <Badge variant="secondary">{category(item.complaint.category)}</Badge>
                </div>
                <h4 className="mt-2 font-bold">{complaintCopy(item.complaint, locale)}</h4>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{location(item.complaint.location_text)}</p>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{tr("Submitted by {department}", { department: department(item.department.name) })}</p>
              </div>
              <Dialog>
                <DialogTrigger asChild><Button variant="outline"><FileCheck2 />{tr("View proof")}</Button></DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{tr("Confirm completion")}</DialogTitle>
                    <DialogDescription>{tr("The task will leave this panel and the resident complaint will close when every assigned department is verified.")}</DialogDescription>
                  </DialogHeader>
                  <div className="border bg-secondary/25 p-4">
                    <span className="font-mono text-xs font-bold text-civic">{item.complaint.reference_number}</span>
                    <p className="mt-2 text-sm leading-7">{complaintCopy(item.complaint, locale)}</p>
                    <p className="mt-3 flex items-center gap-1 text-sm font-semibold"><MapPin className="size-4 text-civic" />{location(item.complaint.location_text)}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {item.proofs.map((proof) => {
                      const source = `${API_URL}/evidence/${encodeURIComponent(proof.storage_reference)}`;
                      return (
                        <div key={proof.id} className="overflow-hidden border">
                          {proof.mime_type.startsWith("image/") ? (
                            <div className="relative aspect-video bg-muted"><Image unoptimized fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" src={source} alt={tr("Completion proof")} /></div>
                          ) : proof.mime_type.startsWith("video/") ? (
                            <video controls className="aspect-video w-full bg-black" src={source} />
                          ) : null}
                          <Button asChild variant="ghost" className="w-full justify-between rounded-none">
                            <a href={source} target="_blank" rel="noreferrer">{tr("View proof")}<ExternalLink /></a>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => void confirm(item)} disabled={busyId === item.assignment.id}>
                      {busyId === item.assignment.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                      {busyId === item.assignment.id ? tr("Confirming…") : tr("Yes, this job is done")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
