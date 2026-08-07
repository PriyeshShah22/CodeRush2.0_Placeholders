"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Clock3, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "./metric-card";
import { ComplaintMapPoint, WardMap } from "./ward-map";
import { useLanguage } from "./language-provider";

type Deadline = { complaint_id: string; reference_number: string; title: string; translation_hi?: string; translation_mr?: string; priority: string; status: string; resolution_due_at: string; remaining_hours: number };
type Data = {
  open_complaints: number;
  resolved_complaints: number;
  active_breaches: number;
  sla_compliance: number;
  categories: { name: string; value: number }[];
  statuses: { name: string; value: number }[];
  map_points: ComplaintMapPoint[];
  deadlines: Deadline[];
};

export function AdminDashboard() {
  const { locale, tr, status, priority, category } = useLanguage();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await api<{ data: Data }>("/admin/dashboard");
      setData(response.data);
    } catch {
      setError(tr("Dashboard unavailable"));
    }
  }, [tr]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = () => void load();
    window.addEventListener("nivaran-workflow-updated", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("nivaran-workflow-updated", refresh);
    };
  }, [load]);

  function timeLeft(hours: number) {
    if (hours <= 0) return tr("{hours}h overdue", { hours: Math.abs(Math.round(hours)) });
    const days = Math.floor(hours / 24);
    const rest = Math.round(hours % 24);
    return days ? tr("{days}d {hours}h left", { days, hours: rest }) : tr("{hours}h left", { hours: rest });
  }

  if (!data && !error)
    return <div className="grid min-h-72 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (!data)
    return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-900"><b>{tr("Operational data could not be loaded.")}</b><p className="mt-2">{error}</p><Button variant="outline" className="mt-4" onClick={() => void load()}>{tr("Try again")}</Button></div>;

  const chartData = data.categories.map((item) => ({ ...item, name: category(item.name) }));
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={tr("Open incidents")} value={data.open_complaints} note={tr("Similar reports counted once")} />
        <MetricCard label={tr("SLA compliance")} value={`${data.sla_compliance}%`} note={tr("From current service deadlines")} />
        <MetricCard label={tr("Overdue")} value={data.active_breaches} note={tr("Already escalated")} attention={data.active_breaches > 0} />
        <MetricCard label={tr("Resolved incidents")} value={data.resolved_complaints} note={tr("Persisted resolutions")} />
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <section className="border bg-card p-5">
          <p className="eyebrow">{tr("Current service mix")}</p>
          <h3 className="mt-2 text-xl font-bold">{tr("Incidents by category")}</h3>
          {chartData.length ? (
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={105} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [value, tr("Incidents")]} />
                  <Bar dataKey="value" fill="var(--civic)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="grid h-64 place-items-center text-sm text-muted-foreground">{tr("No categorized incidents yet.")}</p>}
        </section>
        <section className="border bg-card p-5">
          <div className="flex items-center justify-between"><div><p className="eyebrow">{tr("Resolution clock")}</p><h3 className="mt-2 text-xl font-bold">{tr("Upcoming deadlines")}</h3></div><Clock3 className="size-5 text-civic" /></div>
          <div className="mt-5 divide-y border">
            {data.deadlines.length ? data.deadlines.map((item) => (
              <Link key={item.complaint_id} href={`/reviewer/complaints/${item.complaint_id}`} className="hover-arrow grid gap-2 p-3 hover:bg-civic/5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><span className="font-mono text-xs font-bold text-civic">{item.reference_number}</span><p className="mt-1 line-clamp-1 text-sm font-semibold">{locale === "hi" ? item.translation_hi || tr("Civic service complaint") : locale === "mr" ? item.translation_mr || tr("Civic service complaint") : item.title}</p><span className="mt-1 block text-xs text-muted-foreground">{priority(item.priority)} · {status(item.status)}</span></div>
                <Badge variant={item.remaining_hours <= 0 ? "destructive" : "outline"}>{timeLeft(item.remaining_hours)}<ArrowRight /></Badge>
              </Link>
            )) : <p className="p-6 text-center text-sm text-muted-foreground">{tr("No active deadlines.")}</p>}
          </div>
        </section>
      </div>
      <WardMap points={data.map_points} />
    </div>
  );
}
