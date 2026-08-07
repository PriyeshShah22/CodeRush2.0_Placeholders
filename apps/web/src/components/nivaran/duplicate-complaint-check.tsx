"use client";

import { Check, Loader2, MapPin, Users } from "lucide-react";
import { NearbyIssue } from "./nearby-issues";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";

const copy={
  en:{eyebrow:"Possible matching issues",title:"Has this already been reported?",intro:"These nearby incidents look similar. Link yourself to an existing issue to receive updates, or continue if yours is different.",done:"Reported as Same Issue",linking:"Linking…",same:"Report Same Issue",edit:"Edit complaint",continue:"Continue creating new complaint"},
  hi:{eyebrow:"संभावित समान समस्याएँ",title:"क्या यह पहले ही दर्ज हो चुका है?",intro:"आस-पास की ये समस्याएँ समान लगती हैं। अपडेट पाने के लिए मौजूदा समस्या से जुड़ें, या आपकी समस्या अलग हो तो आगे बढ़ें।",done:"यही समस्या दर्ज की",linking:"जोड़ा जा रहा है…",same:"यही समस्या बताएं",edit:"शिकायत संपादित करें",continue:"नई शिकायत बनाना जारी रखें"},
  mr:{eyebrow:"संभाव्य समान समस्या",title:"ही समस्या आधीच नोंदवली आहे का?",intro:"जवळच्या या समस्या समान दिसतात. अपडेटसाठी विद्यमान समस्येशी जोडा, किंवा तुमची समस्या वेगळी असल्यास पुढे जा.",done:"हीच समस्या नोंदवली",linking:"जोडत आहे…",same:"हीच समस्या नोंदवा",edit:"तक्रार संपादित करा",continue:"नवीन तक्रार नोंदवणे सुरू ठेवा"},
} as const;

export function DuplicateComplaintCheck({issues,busy,onSame,onContinue,onBack}:{issues:NearbyIssue[];busy?:string;onSame:(issue:NearbyIssue)=>void;onContinue:()=>void;onBack:()=>void}){
  const {locale,status,category,location}=useLanguage(); const c=copy[locale];
  return <section className="border border-amber-300 bg-amber-50/50 p-5 sm:p-6"><p className="eyebrow">{c.eyebrow}</p><h3 className="mt-2 text-2xl font-bold">{c.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c.intro}</p><div className="mt-5 space-y-3">{issues.map(issue=><article key={issue.id} className="border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Badge variant="outline">{category(issue.category)}</Badge><Badge variant="secondary">{status(issue.status)}</Badge></div><b className="mt-2 block">{issue.title}</b><p className="mt-1 line-clamp-1 text-xs text-muted-foreground"><MapPin className="mr-1 inline size-3"/>{location(issue.location_text)}</p></div><span className="flex items-center gap-1 text-sm font-bold"><Users className="size-4 text-civic"/>{issue.affected_residents}</span></div><Button className="mt-3" size="sm" disabled={issue.already_affected||Boolean(busy)} onClick={()=>onSame(issue)}>{issue.already_affected?<><Check/>{c.done}</>:busy===issue.id?<><Loader2 className="animate-spin"/>{c.linking}</>:c.same}</Button></article>)}</div><div className="mt-5 flex flex-wrap justify-between gap-3 border-t pt-4"><Button variant="ghost" onClick={onBack}>{c.edit}</Button><Button variant="outline" disabled={Boolean(busy)} onClick={onContinue}>{c.continue}</Button></div></section>;
}
