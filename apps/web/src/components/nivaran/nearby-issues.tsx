"use client";

import { useState } from "react";
import { CalendarDays, Check, Loader2, LocateFixed, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ResidentPosition={latitude:number;longitude:number;accuracy?:number};
export type NearbyIssue={id:string;title:string;category:string;status:string;location_text:string;distance_metres:number;independent_reports:number;community_confirmations:number;affected_residents:number;already_affected:boolean;updated_at:string};

export function currentResidentPosition():Promise<ResidentPosition>{
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(new Error("Location is not supported by this browser."));return;}
    navigator.geolocation.getCurrentPosition(
      ({coords})=>resolve({latitude:coords.latitude,longitude:coords.longitude,accuracy:coords.accuracy}),
      ()=>reject(new Error("Allow location access to find nearby issues.")),
      {enableHighAccuracy:true,timeout:12000,maximumAge:60000},
    );
  });
}

export async function ownIncidentIds(){
  const complaints=await api<{data:Complaint[]}>("/complaints");
  const ids=await Promise.all(complaints.data.map(complaint=>api<{data:{incident?:{id:string}}}>(`/complaints/${complaint.id}`).then(response=>response.data.incident?.id).catch(()=>undefined)));
  return new Set(ids.filter((id):id is string=>Boolean(id)));
}

export async function findNearbyIssues(position:ResidentPosition){
  const [response,own]=await Promise.all([
    api<{data:NearbyIssue[]}>(`/community/issues/nearby?latitude=${position.latitude}&longitude=${position.longitude}&radius=10000`),
    ownIncidentIds(),
  ]);
  return response.data.filter(issue=>!own.has(issue.id));
}

function distanceLabel(metres:number){return metres<1000?`${metres} m away`:`${(metres/1000).toFixed(1)} km away`;}

export function NearbyIssues(){
  const [position,setPosition]=useState<ResidentPosition>();
  const [rows,setRows]=useState<NearbyIssue[]>([]);
  const [loading,setLoading]=useState(false);
  const [confirming,setConfirming]=useState<string>();
  const [error,setError]=useState("");

  async function locate(){
    setLoading(true);setError("");
    try{const next=await currentResidentPosition();setPosition(next);setRows(await findNearbyIssues(next));}
    catch(reason){setError(reason instanceof Error?reason.message:"Nearby issues are unavailable.");}
    finally{setLoading(false);}
  }

  async function confirm(issue:NearbyIssue){
    setConfirming(issue.id);
    try{
      const next=position||await currentResidentPosition();
      const response=await api<{data:{affected_residents:number}}>(`/community/incidents/${issue.id}/affected`,{method:"POST",body:JSON.stringify({latitude:next.latitude,longitude:next.longitude,location_accuracy_metres:next.accuracy})});
      setRows(current=>current.map(row=>row.id===issue.id?{...row,already_affected:true,affected_residents:response.data.affected_residents,community_confirmations:row.community_confirmations+1}:row));
      toast.success("Reported as the same issue. You will receive future updates.");
    }catch(reason){toast.error(reason instanceof Error?reason.message:"Could not report the same issue");}
    finally{setConfirming(undefined);}
  }

  if(!position&&!loading)return <section className="border bg-card p-6"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-civic/10 text-civic"><LocateFixed/></span><div><p className="eyebrow">Nearby issues</p><h3 className="mt-2 text-2xl font-bold">Issues reported by other residents</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Allow location access to find community incidents around you. Resident names and contact information are never shown.</p><Button className="mt-5" onClick={locate}><LocateFixed/>Allow location and find issues</Button>{error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}</div></div></section>;
  if(loading)return <div className="grid min-h-48 place-items-center border bg-card"><Loader2 className="animate-spin text-civic"/></div>;
  return <div><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Nearby issues</p><h3 className="mt-2 text-2xl font-bold">Issues reported by other residents</h3><p className="mt-2 text-xs text-muted-foreground">Requested radius: 10 km. The current existing API returns up to its configured 5 km limit.</p></div><Button variant="outline" onClick={locate}><LocateFixed/>Refresh location</Button></div>{error&&<p role="alert" className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}{!rows.length?<div className="border bg-card p-8 text-center text-sm text-muted-foreground">No active issues reported by other residents were found in the available nearby radius.</div>:<div className="grid gap-4 lg:grid-cols-2">{rows.map(issue=><article key={issue.id} className="border bg-card p-5"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="capitalize">{issue.category.replaceAll("_"," ")}</Badge><Badge variant="secondary" className="capitalize">{issue.status.replaceAll("_"," ")}</Badge></div><MapPin className="size-5 shrink-0 text-civic"/></div><h4 className="mt-3 text-lg font-bold">{issue.title}</h4><div className="mt-3 rounded-sm bg-secondary/50 p-3"><p className="line-clamp-2 text-xs text-muted-foreground"><MapPin className="mr-1 inline size-3"/>{issue.location_text}</p></div><div className="mt-4 grid grid-cols-3 gap-3 border-y py-4 text-sm"><div><span className="text-xs text-muted-foreground">Distance</span><b className="mt-1 block">{distanceLabel(issue.distance_metres)}</b></div><div><span className="text-xs text-muted-foreground">Affected</span><b className="mt-1 flex items-center gap-1"><Users className="size-3 text-civic"/>{issue.affected_residents}</b></div><div><span className="text-xs text-muted-foreground">Reported</span><b className="mt-1 flex items-center gap-1 text-xs"><CalendarDays className="size-3 text-civic"/>{new Date(issue.updated_at).toLocaleDateString()}</b></div></div><Button className="mt-4 w-full" variant={issue.already_affected?"secondary":"default"} disabled={issue.already_affected||confirming===issue.id} onClick={()=>confirm(issue)}>{issue.already_affected?<><Check/>Reported as Same Issue</>:confirming===issue.id?<><Loader2 className="animate-spin"/>Checking proximity…</>:<><Users/>Report Same Issue</>}</Button></article>)}</div>}</div>;
}
