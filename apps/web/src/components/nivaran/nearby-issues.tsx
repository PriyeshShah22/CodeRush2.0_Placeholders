"use client";

import { useState } from "react";
import { CalendarDays, Check, Loader2, LocateFixed, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";

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

const copy={
  en:{nearby:"Nearby issues",title:"Issues reported by other residents",intro:"Allow location access to find community incidents around you. Resident names and contact information are never shown.",allow:"Allow location and find issues",refresh:"Refresh location",radius:"Showing active community issues within the protected nearby radius.",empty:"No active issues reported by other residents were found nearby.",distance:"Distance",affected:"Affected",reported:"Reported",same:"Report Same Issue",done:"Reported as Same Issue",checking:"Checking proximity…",success:"Reported as the same issue. You will receive future updates.",failed:"Could not report the same issue",unsupported:"Location is not supported by this browser.",permission:"Allow location access to find nearby issues.",unavailable:"Nearby issues are unavailable.",away:"away"},
  hi:{nearby:"आस-पास की समस्याएँ",title:"अन्य निवासियों द्वारा दर्ज समस्याएँ",intro:"अपने आसपास की सामुदायिक समस्याएँ देखने के लिए स्थान की अनुमति दें। निवासी का नाम और संपर्क जानकारी कभी नहीं दिखाई जाती।",allow:"स्थान दें और समस्याएँ खोजें",refresh:"स्थान फिर जाँचें",radius:"सुरक्षित निकटवर्ती दायरे की सक्रिय सामुदायिक समस्याएँ दिखाई जा रही हैं।",empty:"आस-पास अन्य निवासियों द्वारा दर्ज कोई सक्रिय समस्या नहीं मिली।",distance:"दूरी",affected:"प्रभावित",reported:"दर्ज",same:"यही समस्या बताएं",done:"यही समस्या दर्ज की",checking:"निकटता जाँची जा रही है…",success:"आपको इसी समस्या से जोड़ा गया है। आगे के अपडेट मिलेंगे।",failed:"इस समस्या से जोड़ा नहीं जा सका",unsupported:"यह ब्राउज़र स्थान सुविधा का समर्थन नहीं करता।",permission:"आस-पास की समस्याएँ खोजने के लिए स्थान की अनुमति दें।",unavailable:"आस-पास की समस्याएँ उपलब्ध नहीं हैं।",away:"दूर"},
  mr:{nearby:"जवळच्या समस्या",title:"इतर नागरिकांनी नोंदवलेल्या समस्या",intro:"तुमच्या आसपासच्या सामुदायिक समस्या शोधण्यासाठी स्थानाची परवानगी द्या. नागरिकांची नावे व संपर्क माहिती कधीही दाखवली जात नाही.",allow:"स्थान द्या आणि समस्या शोधा",refresh:"स्थान पुन्हा तपासा",radius:"सुरक्षित जवळच्या परिघातील सक्रिय सामुदायिक समस्या दाखवल्या आहेत.",empty:"जवळपास इतर नागरिकांनी नोंदवलेली सक्रिय समस्या आढळली नाही.",distance:"अंतर",affected:"प्रभावित",reported:"नोंद",same:"हीच समस्या नोंदवा",done:"हीच समस्या नोंदवली",checking:"जवळीक तपासत आहे…",success:"तुम्हाला याच समस्येशी जोडले आहे. पुढील अपडेट मिळतील.",failed:"या समस्येशी जोडता आले नाही",unsupported:"हा ब्राउझर स्थान सुविधा समर्थित करत नाही.",permission:"जवळच्या समस्या शोधण्यासाठी स्थानाची परवानगी द्या.",unavailable:"जवळच्या समस्या उपलब्ध नाहीत.",away:"दूर"},
} as const;

export function NearbyIssues(){
  const {locale,status,category,date,location}=useLanguage();
  const c=copy[locale];
  const [position,setPosition]=useState<ResidentPosition>();
  const [rows,setRows]=useState<NearbyIssue[]>([]);
  const [loading,setLoading]=useState(false);
  const [confirming,setConfirming]=useState<string>();
  const [error,setError]=useState("");

  async function locate(){
    setLoading(true);setError("");
    try{const next=await currentResidentPosition();setPosition(next);setRows(await findNearbyIssues(next));}
    catch{setError(c.unavailable);}
    finally{setLoading(false);}
  }

  async function confirm(issue:NearbyIssue){
    setConfirming(issue.id);
    try{
      const next=position||await currentResidentPosition();
      const response=await api<{data:{affected_residents:number}}>(`/community/incidents/${issue.id}/affected`,{method:"POST",body:JSON.stringify({latitude:next.latitude,longitude:next.longitude,location_accuracy_metres:next.accuracy})});
      setRows(current=>current.map(row=>row.id===issue.id?{...row,already_affected:true,affected_residents:response.data.affected_residents,community_confirmations:row.community_confirmations+1}:row));
      toast.success(c.success);
    }catch{toast.error(c.failed);}
    finally{setConfirming(undefined);}
  }

  if(!position&&!loading)return <section className="border bg-card p-6"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-civic/10 text-civic"><LocateFixed/></span><div><p className="eyebrow">{c.nearby}</p><h3 className="mt-2 text-2xl font-bold">{c.title}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{c.intro}</p><Button className="mt-5" onClick={locate}><LocateFixed/>{c.allow}</Button>{error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}</div></div></section>;
  if(loading)return <div className="grid min-h-48 place-items-center border bg-card"><Loader2 className="animate-spin text-civic"/></div>;
  return <div><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{c.nearby}</p><h3 className="mt-2 text-2xl font-bold">{c.title}</h3><p className="mt-2 text-xs text-muted-foreground">{c.radius}</p></div><Button variant="outline" onClick={locate}><LocateFixed/>{c.refresh}</Button></div>{error&&<p role="alert" className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}{!rows.length?<div className="border bg-card p-8 text-center text-sm text-muted-foreground">{c.empty}</div>:<div className="grid gap-4 lg:grid-cols-2">{rows.map(issue=><article key={issue.id} className="border bg-card p-5"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{category(issue.category)}</Badge><Badge variant="secondary">{status(issue.status)}</Badge></div><MapPin className="size-5 shrink-0 text-civic"/></div><h4 className="mt-3 text-lg font-bold">{issue.title}</h4><div className="mt-3 rounded-sm bg-secondary/50 p-3"><p className="line-clamp-2 text-xs text-muted-foreground"><MapPin className="mr-1 inline size-3"/>{location(issue.location_text)}</p></div><div className="mt-4 grid grid-cols-3 gap-3 border-y py-4 text-sm"><div><span className="text-xs text-muted-foreground">{c.distance}</span><b className="mt-1 block">{issue.distance_metres<1000?`${issue.distance_metres} m ${c.away}`:`${(issue.distance_metres/1000).toFixed(1)} km ${c.away}`}</b></div><div><span className="text-xs text-muted-foreground">{c.affected}</span><b className="mt-1 flex items-center gap-1"><Users className="size-3 text-civic"/>{issue.affected_residents}</b></div><div><span className="text-xs text-muted-foreground">{c.reported}</span><b className="mt-1 flex items-center gap-1 text-xs"><CalendarDays className="size-3 text-civic"/>{date(issue.updated_at)}</b></div></div><Button className="mt-4 w-full" variant={issue.already_affected?"secondary":"default"} disabled={issue.already_affected||confirming===issue.id} onClick={()=>confirm(issue)}>{issue.already_affected?<><Check/>{c.done}</>:confirming===issue.id?<><Loader2 className="animate-spin"/>{c.checking}</>:<><Users/>{c.same}</>}</Button></article>)}</div>}</div>;
}
