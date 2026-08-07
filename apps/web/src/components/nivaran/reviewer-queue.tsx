"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Filter, Loader2, MapPin, Search } from "lucide-react";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewerQueue({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [query, setQuery] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api<{ data: Complaint[] }>("/reviewer/queue").then((response) => setRows(response.data)).catch((caught) => setError(caught instanceof Error ? caught.message : "Queue unavailable")).finally(() => setLoading(false)); }, []);
  const filtered = rows.filter((complaint) => (!riskOnly || ["critical", "high"].includes(complaint.priority)) && `${complaint.reference_number} ${complaint.title} ${complaint.category} ${complaint.ward}`.toLowerCase().includes(query.toLowerCase())).slice(0, compact ? 5 : 30);
  return <div className="border bg-card">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search complaint, ward, category…" className="pl-9" /></div><Button variant={riskOnly ? "default" : "outline"} onClick={() => setRiskOnly((value) => !value)}><Filter />{riskOnly ? "High-priority filter on" : "Show high priority"}</Button></div>
    {loading && <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-civic" /></div>}
    {error && <p role="alert" className="m-4 border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    {!loading && !error && filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No complaints currently need review.</p>}
    <div className="divide-y">{filtered.map((complaint) => <article key={complaint.id} className="grid items-center gap-4 p-4 md:grid-cols-[1.25fr_.75fr_.55fr_auto]"><div><span className="font-mono text-xs font-bold text-civic">{complaint.reference_number}</span><h3 className="mt-1 line-clamp-2 text-sm font-bold">{complaint.title || complaint.safe_text}</h3><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{complaint.ward || complaint.location_text}</p></div><div><span className="text-xs text-muted-foreground">AI recommendation</span><p className="mt-1 text-sm capitalize">{complaint.category || "Manual classification"}</p></div><div className="flex flex-wrap gap-2"><Badge variant={complaint.priority === "critical" ? "destructive" : "outline"} className="capitalize">{complaint.priority}</Badge><Badge variant={complaint.priority_reviewed ? "secondary" : "outline"}>{complaint.priority_reviewed ? "Approved" : "Approval required"}</Badge></div><Button asChild variant="outline" size="sm"><Link href={`/reviewer/complaints/${complaint.id}`}>Review / edit</Link></Button></article>)}</div>
  </div>;
}
