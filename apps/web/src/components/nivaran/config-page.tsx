"use client";
import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
type Department = { id: string; code: string; name: string; service_types: string[]; capacity: number; active: boolean };
type Rule = { rule: { id: string; category: string; ward: string; acknowledgement_hours: number; resolution_hours: number; version: string }; department: Department };
export function ConfigPage({ kind = "departments" }: { kind?: "departments" | "rules" }) {
  const [rows, setRows] = useState<Department[]>([]); const [rules, setRules] = useState<Rule[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const endpoint = kind === "rules" ? "/admin/service-rules" : "/admin/departments"; api<{ data: Department[] | Rule[] }>(endpoint).then((response) => kind === "rules" ? setRules(response.data as Rule[]) : setRows(response.data as Department[])).catch((caught) => setError(caught instanceof Error ? caught.message : "Configuration unavailable")).finally(() => setLoading(false)); }, [kind]);
  if (loading) return <div className="grid min-h-48 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (error) return <p className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}</p>;
  if (kind === "rules") return <div className="divide-y border bg-card">{rules.map(({ rule, department }) => <article key={rule.id} className="grid gap-3 p-5 md:grid-cols-[.8fr_1fr_.7fr_.7fr]"><div><span className="text-xs text-muted-foreground">Category</span><b className="mt-1 block capitalize">{rule.category.replaceAll("_", " ")}</b></div><div><span className="text-xs text-muted-foreground">Eligible department</span><b className="mt-1 block">{department.name}</b></div><div><span className="text-xs text-muted-foreground">Ward coverage</span><b className="mt-1 block">{rule.ward === "*" ? "All wards" : rule.ward}</b></div><div><span className="text-xs text-muted-foreground">Service window</span><b className="mt-1 block">{rule.acknowledgement_hours}h / {rule.resolution_hours}h</b></div></article>)}</div>;
  return <div className="grid gap-4 md:grid-cols-2">{rows.map((department) => <article key={department.id} className="border bg-card p-5"><div className="flex items-start justify-between gap-3"><Building2 className="size-5 text-civic" /><Badge variant={department.active ? "secondary" : "outline"}>{department.active ? "Active" : "Inactive"}</Badge></div><h3 className="mt-5 text-lg font-bold">{department.name}</h3><p className="mt-2 text-sm capitalize text-muted-foreground">{department.service_types.map((item) => item.replaceAll("_", " ")).join(" · ")}</p><p className="mt-5 border-t pt-4 text-xs"><b>{department.capacity}</b> configured response teams · code <span className="font-mono">{department.code}</span></p></article>)}</div>;
}
