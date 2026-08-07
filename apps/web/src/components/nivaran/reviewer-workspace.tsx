"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { api, Complaint } from "@/lib/api";
import { QuickReviewDialog } from "./quick-review-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Detail={complaint:Complaint;incident?:{linked_reports:number;clubbed:boolean};routes:{department_id:string;department:string}[]};

export function ReviewerWorkspace({id}:{id:string}){
  const [detail,setDetail]=useState<Detail>();const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  async function load(){setLoading(true);try{const response=await api<{data:Detail}>(`/complaints/${id}`);setDetail(response.data);setError("");}catch(reason){setError(reason instanceof Error?reason.message:"Complaint unavailable");}finally{setLoading(false);}}
  useEffect(()=>{api<{data:Detail}>(`/complaints/${id}`).then((response)=>setDetail(response.data)).catch((reason)=>setError(reason instanceof Error?reason.message:"Complaint unavailable")).finally(()=>setLoading(false));},[id]);
  if(loading)return <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-civic"/></div>;
  if(!detail)return <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}<Button variant="outline" className="mt-4" onClick={load}>Try again</Button></div>;
  const c=detail.complaint;return <div className="mx-auto max-w-3xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs font-bold text-civic">{c.reference_number}</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Complaint review</h2></div><Badge variant={c.priority==="critical"?"destructive":"outline"} className="capitalize">{c.priority} priority</Badge></div><section className="mt-6 border bg-card p-5 sm:p-6"><p className="text-base leading-7">{c.original_text}</p>{c.normalized_text&&c.normalized_text!==c.original_text&&<div className="mt-5 border-t pt-5"><span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">English translation</span><p className="mt-2 text-sm leading-6">{c.normalized_text}</p></div>}<p className="mt-5 flex items-start gap-2 border-t pt-5 text-sm font-semibold"><MapPin className="mt-0.5 size-4 text-civic"/>{c.location_text}</p>{detail.incident&&detail.incident.linked_reports>1&&<p className="mt-4 bg-civic/5 p-3 text-sm">Linked with {detail.incident.linked_reports-1} other nearby report{detail.incident.linked_reports===2?"":"s"}.</p>}</section><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">AI recommends. Your approval or recorded override controls assignment.</p>{["awaiting_review","reopened"].includes(c.status)?<QuickReviewDialog complaint={c} onComplete={load} triggerLabel="Review decision"/>:<Badge className="capitalize">{c.status.replaceAll("_"," ")}</Badge>}</div></div>;
}
