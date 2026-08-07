"use client";
import { useEffect, useState } from "react";
import { Fingerprint, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "./language-provider";
type Event = { id: string; entity_type: string; entity_id: string; actor_role: string; action: string; reason?: string; source_component: string; created_at: string };
export function AuditView() {
  const { locale, tr, roleLabel, action, date } = useLanguage();
  const [rows, setRows] = useState<Event[]>([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { api<{ data: Event[] }>("/admin/audit").then((response) => setRows(response.data)).catch(() => setError(tr("Audit unavailable"))).finally(() => setLoading(false)); }, [tr]);
  const filtered = rows.filter((event) => JSON.stringify(event).toLowerCase().includes(query.toLowerCase()));
  return <div className="border bg-card"><div className="flex flex-wrap items-center gap-3 border-b p-4"><div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder={tr("Search action, actor, entity…")} /></div><Badge variant="outline"><Fingerprint />{tr("Append-only application events")}</Badge></div>{loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-civic" /></div> : error ? <p className="m-4 border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p> : !filtered.length ? <p className="p-8 text-center text-sm text-muted-foreground">{tr("No matching audit events.")}</p> : <div className="divide-y">{filtered.map((event) => <article key={event.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_.8fr_.8fr]"><div><b className="text-sm">{action(event.action)}</b><span className="mt-1 block font-mono text-xs text-muted-foreground">{event.entity_id}</span></div><div><span className="text-xs text-muted-foreground">{tr("Actor / source")}</span><b className="mt-1 block text-sm">{roleLabel(event.actor_role)} · {event.source_component}</b></div><div><span className="text-xs text-muted-foreground">{tr("Reason")}</span><p className="mt-1 text-xs">{locale === "en" && event.reason ? event.reason : tr("Recorded workflow event")}</p></div><time className="font-mono text-xs text-muted-foreground">{date(event.created_at)}</time></article>)}</div>}</div>;
}
