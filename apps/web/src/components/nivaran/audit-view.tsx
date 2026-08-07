"use client";
import { useEffect, useState } from "react";
import { Fingerprint, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
type Event = { id: string; entity_type: string; entity_id: string; actor_role: string; action: string; reason?: string; source_component: string; created_at: string };
export function AuditView() {
  const [rows, setRows] = useState<Event[]>([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { api<{ data: Event[] }>("/admin/audit").then((response) => setRows(response.data)).catch((caught) => setError(caught instanceof Error ? caught.message : "Audit unavailable")).finally(() => setLoading(false)); }, []);
  const filtered = rows.filter((event) => JSON.stringify(event).toLowerCase().includes(query.toLowerCase()));
  return <div className="border bg-card"><div className="flex flex-wrap items-center gap-3 border-b p-4"><div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search action, actor, entity…" /></div><Badge variant="outline"><Fingerprint />Append-only application events</Badge></div>{loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-civic" /></div> : error ? <p className="m-4 border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p> : !filtered.length ? <p className="p-8 text-center text-sm text-muted-foreground">No matching audit events.</p> : <div className="divide-y">{filtered.map((event) => <article key={event.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_.8fr_.8fr]"><div><b className="text-sm capitalize">{event.action.replaceAll("_", " ")}</b><span className="mt-1 block font-mono text-xs text-muted-foreground">{event.entity_id}</span></div><div><span className="text-xs text-muted-foreground">Actor / source</span><b className="mt-1 block text-sm">{event.actor_role} · {event.source_component}</b></div><div><span className="text-xs text-muted-foreground">Reason</span><p className="mt-1 text-xs">{event.reason || "Recorded workflow event"}</p></div><time className="font-mono text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</time></article>)}</div>}</div>;
}
