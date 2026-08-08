"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { QuickReviewDialog } from "./quick-review-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";

function complaintCopy(complaint: Complaint, locale: "en" | "hi" | "mr") {
  if (locale === "hi") return complaint.translation_hi || complaint.normalized_text || complaint.safe_text;
  if (locale === "mr") return complaint.translation_mr || complaint.normalized_text || complaint.safe_text;
  return complaint.normalized_text || complaint.safe_text;
}
type ReviewRow=Complaint&{sla?:{review_due_at?:string;review_breached_at?:string}};

export function ReviewerQueue({ compact = false }: { compact?: boolean }) {
  const { locale, tr, priority, location } = useLanguage();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [simulating,setSimulating]=useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api<{ data: ReviewRow[] }>("/reviewer/queue");
      setRows(response.data.filter((item) => ["awaiting_review", "reopened"].includes(item.status)));
      setError("");
    } catch {
      setError(tr("Queue unavailable"));
    } finally {
      setLoading(false);
    }
  }, [tr]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  async function simulateReviewBreach(id:string){setSimulating(id);try{await api(`/complaints/${id}/sla/simulate`,{method:"POST",body:JSON.stringify({stage:"review"})});toast.success(tr("Review SLA breached and escalated to Admin"));await load();}catch{toast.error(tr("Simulation failed"));}finally{setSimulating("");}}
  const visible = compact ? rows.slice(0, 5) : rows;
  if (loading) return <div className="grid min-h-40 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (error) return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}</div>;
  if (!visible.length) return <div className="border bg-card p-8 text-center"><h3 className="font-bold">{tr("Nothing awaiting review")}</h3><p className="mt-2 text-sm text-muted-foreground">{tr("New AI recommendations will appear here.")}</p></div>;
  return (
    <div className="divide-y border bg-card">
      {visible.map((complaint) => (
        <article key={complaint.id} className="grid gap-4 p-4 transition-colors hover:bg-civic/5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-civic">{complaint.reference_number}</span><Badge variant={complaint.priority === "critical" ? "destructive" : "outline"}>{priority(complaint.priority)}</Badge></div>
            <h3 className="mt-2 line-clamp-2 text-sm font-bold">{complaintCopy(complaint, locale)}</h3>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{location(complaint.location_text)}</p>
            {complaint.sla?.review_due_at?<p className="mt-2 text-xs font-medium text-muted-foreground">{tr("Review by {date}",{date:new Date(complaint.sla.review_due_at).toLocaleString()})}</p>:null}
          </div>
          <div className="flex flex-wrap gap-2"><QuickReviewDialog complaint={complaint} onComplete={load} /><Button size="sm" variant="ghost" disabled={Boolean(simulating)||Boolean(complaint.sla?.review_breached_at)} onClick={()=>void simulateReviewBreach(complaint.id)} title={tr("Simulate review SLA breach")}><FlaskConical/>{simulating===complaint.id?tr("Running…"):complaint.sla?.review_breached_at?tr("Escalated"):tr("SLA demo")}</Button><Button asChild size="sm" variant="ghost"><Link href={`/reviewer/complaints/${complaint.id}`}>{tr("Open details")}</Link></Button></div>
        </article>
      ))}
    </div>
  );
}
