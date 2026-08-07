"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
type Task = { assignment: { id: string; kind: string; status: string; assigned_at: string }; complaint: Complaint };
export function DepartmentTasks({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<Task[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { api<{ data: Task[] }>("/department/tasks").then((response) => setRows(response.data)).catch((caught) => setError(caught instanceof Error ? caught.message : "Tasks unavailable")).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="grid min-h-40 place-items-center border bg-card"><Loader2 className="animate-spin text-civic" /></div>;
  if (error) return <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>;
  if (!rows.length) return <p className="border bg-card p-8 text-center text-sm text-muted-foreground">No persisted tasks are assigned to this department.</p>;
  return <div className="space-y-3">{rows.slice(0, compact ? 4 : 20).map(({ assignment, complaint }) => <article key={assignment.id} className="grid items-center gap-4 border bg-card p-5 md:grid-cols-[1.2fr_.6fr_.6fr_auto]"><div><div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-civic">{complaint.reference_number}</span><Badge variant="outline" className="capitalize">{assignment.kind}</Badge></div><h3 className="mt-2 font-bold">{complaint.title || complaint.normalized_text || complaint.category}</h3><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{complaint.location_text}</span></div><div><span className="text-xs text-muted-foreground">Task state</span><b className="mt-1 block text-sm capitalize">{assignment.status.replaceAll("_", " ")}</b></div><div><span className="text-xs text-muted-foreground">Assigned</span><b className="mt-1 block text-sm">{new Date(assignment.assigned_at).toLocaleString()}</b></div><Button asChild variant="outline" size="sm"><Link href={`/department/tasks/${assignment.id}`}>Open <ArrowRight /></Link></Button></article>)}</div>;
}
