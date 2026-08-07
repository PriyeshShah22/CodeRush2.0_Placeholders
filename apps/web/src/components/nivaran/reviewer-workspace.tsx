"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { api, Complaint } from "@/lib/api";
import { QuickReviewDialog } from "./quick-review-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";

type Detail = { complaint: Complaint; incident?: { linked_reports: number; clubbed: boolean }; routes: { department_id: string; department: string }[] };

export function ReviewerWorkspace({ id }: { id: string }) {
  const { locale, tr, priority, status, location } = useLanguage();
  const [detail, setDetail] = useState<Detail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api<{ data: Detail }>(`/complaints/${id}`);
      setDetail(response.data);
      setError("");
    } catch {
      setError(tr("Complaint unavailable"));
    } finally {
      setLoading(false);
    }
  }, [id, tr]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (loading) return <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-civic" /></div>;
  if (!detail) return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}<Button variant="outline" className="mt-4" onClick={() => void load()}>{tr("Try again")}</Button></div>;
  const complaint = detail.complaint;
  const translated = locale === "hi" ? complaint.translation_hi || complaint.normalized_text : locale === "mr" ? complaint.translation_mr || complaint.normalized_text : complaint.normalized_text;
  const linked = (detail.incident?.linked_reports || 1) - 1;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs font-bold text-civic">{complaint.reference_number}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">{tr("Complaint review")}</h2></div><Badge variant={complaint.priority === "critical" ? "destructive" : "outline"}>{priority(complaint.priority)}</Badge></div>
      <section className="mt-6 border bg-card p-5 sm:p-6">
        <p className="text-base leading-7">{complaint.original_text}</p>
        {translated && translated !== complaint.original_text ? <div className="mt-5 border-t pt-5"><span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{tr(locale === "hi" ? "Hindi translation" : locale === "mr" ? "Marathi translation" : "English translation")}</span><p className="mt-2 text-sm leading-6">{translated}</p></div> : null}
        <p className="mt-5 flex items-start gap-2 border-t pt-5 text-sm font-semibold"><MapPin className="mt-0.5 size-4 text-civic" />{location(complaint.location_text)}</p>
        {linked > 0 ? <p className="mt-4 bg-civic/5 p-3 text-sm">{tr(linked === 1 ? "Linked with {count} other nearby report." : "Linked with {count} other nearby reports.", { count: linked })}</p> : null}
      </section>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{tr("AI recommends. Your approval or recorded override controls assignment.")}</p>{["awaiting_review", "reopened"].includes(complaint.status) ? <QuickReviewDialog complaint={complaint} onComplete={load} triggerLabel="Review decision" /> : <Badge>{status(complaint.status)}</Badge>}</div>
    </div>
  );
}
