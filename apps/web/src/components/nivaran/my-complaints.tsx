"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Clock3, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Detail={
  complaint:Complaint;
  routes:{department:string}[];
  timeline:{id:string;action:string;created_at:string}[];
};

const progress:Record<string,number>={submitted:10,processing:20,awaiting_review:35,assigned:50,acknowledged:65,in_progress:80,escalated:75,resolved:100,reopened:30};

export function MyComplaints({refreshKey=0}:{refreshKey?:number}){
  const [rows,setRows]=useState<Detail[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const complaints=await api<{data:Complaint[]}>("/complaints");
      const details=await Promise.all(complaints.data.map(item=>api<{data:Detail}>(`/complaints/${item.id}`).then(response=>response.data)));
      setRows(details);
    }catch(reason){setError(reason instanceof Error?reason.message:"Complaints unavailable");}
    finally{setLoading(false);}
  }
  useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer);},[refreshKey]);

  if(loading)return <div className="grid min-h-48 place-items-center border bg-card"><Loader2 className="animate-spin text-civic"/></div>;
  if(error)return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-900"><b>We could not load your complaints.</b><p className="mt-2">{error}</p><Button variant="outline" className="mt-4" onClick={load}>Try again</Button></div>;
  if(!rows.length)return <div className="border bg-card p-8 text-center"><ShieldCheck className="mx-auto size-7 text-civic"/><h3 className="mt-4 text-xl font-bold">No complaints yet</h3><p className="mt-2 text-sm text-muted-foreground">Use Report Issue or the AI assistant to file one.</p></div>;

  return <div className="space-y-4">{rows.map(({complaint,routes,timeline})=>{
    const latest=[...timeline].reverse().slice(0,3);
    const department=routes.length?routes.map(route=>route.department).join(" + "):"Awaiting reviewer assignment";
    const assigned=["assigned","acknowledged","in_progress","escalated","resolved"].includes(complaint.status);
    return <article key={complaint.id} className="border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-civic">{complaint.reference_number}</span><Badge variant="outline" className="capitalize">{complaint.status.replaceAll("_"," ")}</Badge></div><h3 className="mt-3 text-lg font-bold">{complaint.title||complaint.normalized_text||complaint.safe_text}</h3><p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 size-3 shrink-0"/>{complaint.location_text}</p></div><Button asChild variant="outline" size="sm"><Link href={`/resident/complaints/${complaint.id}`}>Full details<ArrowRight/></Link></Button></div><div className="mt-5 grid gap-4 border-y py-4 md:grid-cols-[1fr_1fr]"><div><span className="flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="size-3"/>{assigned?"Assigned department":"Recommended department"}</span><b className="mt-1 block text-sm">{department}</b></div><div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><b>{progress[complaint.status]??0}%</b></div><Progress className="mt-2" value={progress[complaint.status]??0}/></div></div><div className="mt-4"><span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Clock3 className="size-3"/>Recent timeline</span>{latest.length?<ol className="mt-3 grid gap-2 sm:grid-cols-3">{latest.map(event=><li key={event.id} className="border-l-2 border-civic/40 pl-3"><b className="block text-xs capitalize">{event.action.replaceAll("_"," ")}</b><time className="mt-1 block text-[11px] text-muted-foreground">{new Date(event.created_at).toLocaleString()}</time></li>)}</ol>:<p className="mt-2 text-xs text-muted-foreground">Processing updates will appear here.</p>}</div>{complaint.status==="resolved"&&<p className="mt-4 text-xs text-muted-foreground">Completion evidence will appear when it is made available by the protected complaint API.</p>}</article>;
  })}</div>;
}
