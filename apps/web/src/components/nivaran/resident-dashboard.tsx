"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FilePlus2, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { api, Complaint } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ResidentDashboard() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() { setLoading(true); setError(""); try { const response = await api<{ data: Complaint[] }>("/complaints"); setRows(response.data); } catch (caught) { setError(caught instanceof Error ? caught.message : "Complaints unavailable"); } finally { setLoading(false); } }
  useEffect(() => { api<{ data: Complaint[] }>("/complaints").then((response) => setRows(response.data)).catch((caught) => setError(caught instanceof Error ? caught.message : "Complaints unavailable")).finally(() => setLoading(false)); }, []);
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Private resident account</p><h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">Your service requests</h2><p className="mt-2 text-sm text-muted-foreground">Only complaints linked to this signed-in account are shown.</p></div><Button asChild><Link href="/resident/report"><FilePlus2 />Report new issue</Link></Button></div>
    {loading && <div className="mt-7 grid min-h-48 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>}
    {error && <div className="mt-7 border border-red-200 bg-red-50 p-5 text-sm text-red-900"><b>We could not load your complaints.</b><p className="mt-2">{error}</p><Button variant="outline" className="mt-4" onClick={load}>Try again</Button></div>}
    {!loading && !error && rows.length === 0 && <div className="mt-7 border bg-card p-8 text-center"><ShieldCheck className="mx-auto size-7 text-civic" /><h3 className="mt-4 text-xl font-bold">No complaints yet</h3><p className="mt-2 text-sm text-muted-foreground">Type or speak a complaint and attach location evidence when you are ready.</p><Button asChild className="mt-5"><Link href="/resident/report">Report an issue</Link></Button></div>}
    {!loading && !error && rows.length > 0 && <div className="mt-7 space-y-3">{rows.map((complaint) => <Link href={`/resident/complaints/${complaint.id}`} key={complaint.id} className="grid gap-4 border bg-card p-5 transition hover:border-civic md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-civic">{complaint.reference_number}</span><Badge variant="outline" className="capitalize">{complaint.status.replaceAll("_", " ")}</Badge></div><h3 className="mt-2 text-lg font-bold">{complaint.title || complaint.normalized_text || complaint.safe_text}</h3><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{complaint.location_text}</p><p className="mt-3 text-xs"><b>Priority:</b> <span className="capitalize">{complaint.priority}</span> · {complaint.priority_reviewed ? "approved by reviewer" : "awaiting reviewer approval"}</p></div><ArrowRight className="size-5 text-civic" /></Link>)}</div>}
  </div>;
}
