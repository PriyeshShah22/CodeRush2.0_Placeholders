"use client";
import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "./language-provider";
type Department = { id: string; code: string; name: string; service_types: string[]; capacity: number; active: boolean };
type Rule = { rule: { id: string; category: string; ward: string; acknowledgement_hours: number; resolution_hours: number; version: string }; department: Department };
export function ConfigPage({ kind = "departments" }: { kind?: "departments" | "rules" }) {
  const { tr, category, department: departmentLabel } = useLanguage();
  const [rows, setRows] = useState<Department[]>([]); const [rules, setRules] = useState<Rule[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const endpoint = kind === "rules" ? "/admin/service-rules" : "/admin/departments"; api<{ data: Department[] | Rule[] }>(endpoint).then((response) => kind === "rules" ? setRules(response.data as Rule[]) : setRows(response.data as Department[])).catch(() => setError(tr("Configuration unavailable"))).finally(() => setLoading(false)); }, [kind, tr]);
  if (loading) return <div className="grid min-h-48 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (error) return <p className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}</p>;
  if (kind === "rules") return <div className="divide-y border bg-card">{rules.map(({ rule, department }) => <article key={rule.id} className="grid gap-3 p-5 md:grid-cols-[.8fr_1fr_.7fr_.7fr]"><div><span className="text-xs text-muted-foreground">{tr("Category")}</span><b className="mt-1 block">{category(rule.category)}</b></div><div><span className="text-xs text-muted-foreground">{tr("Eligible department")}</span><b className="mt-1 block">{departmentLabel(department.name)}</b></div><div><span className="text-xs text-muted-foreground">{tr("Ward coverage")}</span><b className="mt-1 block">{rule.ward === "*" ? tr("All wards") : rule.ward}</b></div><div><span className="text-xs text-muted-foreground">{tr("Service window")}</span><b className="mt-1 block">{tr("{hours} hours", { hours: rule.acknowledgement_hours })} / {tr("{hours} hours", { hours: rule.resolution_hours })}</b></div></article>)}</div>;
  return <div className="grid gap-4 md:grid-cols-2">{rows.map((item) => <article key={item.id} className="border bg-card p-5"><div className="flex items-start justify-between gap-3"><Building2 className="size-5 text-civic" /><Badge variant={item.active ? "secondary" : "outline"}>{tr(item.active ? "Active" : "Inactive")}</Badge></div><h3 className="mt-5 text-lg font-bold">{departmentLabel(item.name)}</h3><p className="mt-2 text-sm text-muted-foreground">{item.service_types.map((service) => category(service)).join(" · ")}</p><p className="mt-5 border-t pt-4 text-xs"><b>{tr("{count} configured response teams", { count: item.capacity })}</b> · {tr("code")} <span className="font-mono">{item.code}</span></p></article>)}</div>;
}
