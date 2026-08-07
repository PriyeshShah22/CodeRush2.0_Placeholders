"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Droplets,
  Lightbulb,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  Wrench,
} from "lucide-react";
import { PublicHeader } from "@/components/nivaran/brand";
import { useLanguage } from "@/components/nivaran/language-provider";
import { Button } from "@/components/ui/button";

const copy = {
  en: {
    eyebrow: "Community redressal, without the runaround",
    title: "Your neighbourhood issue, carried to the right desk.",
    body: "Type it, speak it, or point to it on a map. Nivaran brings repeat reports together, recommends urgency and a resolution time, and keeps a human responsible for every decision.",
    cta: "Report an issue",
    signIn: "Sign in",
    proof: [
      "3 interface languages",
      "Human approval required",
      "Identity protected",
    ],
    journey: "Live complaint journey",
    waiting: "Awaiting review",
    sample: "Water collecting around a deep pothole near the school gate.",
    location: "Samanvay School Road, Pune",
    stages: [
      ["Private details protected", "Completed"],
      ["Matched with 12 nearby reports", "Shared incident"],
      ["Urgency and deadline suggested", "Human decision next"],
    ],
    services: [
      "Roads",
      "Water",
      "Drainage",
      "Sanitation",
      "Electrical",
      "Safety",
    ],
    path: "One clear path",
    trust: "Built around resident trust",
    steps: [
      [
        "Tell us naturally",
        "Type or speak in English, Hindi, or Marathi. Add a photo, video, or a location you can verify.",
      ],
      [
        "Join the shared incident",
        "Nearby reports about the same place are grouped as +1 without exposing who made them.",
      ],
      [
        "Follow accountable action",
        "A reviewer confirms priority, department, and resolution time before work begins.",
      ],
    ],
    closing: "A civic workflow residents can actually follow.",
    synthetic:
      "This demonstration uses a clearly labelled synthetic municipality.",
    open: "Open workspace",
    footer: "Synthetic civic operations prototype",
    disclaimer: "No municipality partnership is implied.",
  },
  hi: {
    eyebrow: "सीधी और जवाबदेह नागरिक शिकायत",
    title: "आपके इलाके की समस्या, सही विभाग तक।",
    body: "लिखें, बोलें या नक्शे पर स्थान चुनें। निवारण मिलती-जुलती शिकायतों को जोड़ता है, प्राथमिकता और समाधान का समय सुझाता है, और हर निर्णय की जिम्मेदारी मानव समीक्षक के पास रखता है।",
    cta: "समस्या दर्ज करें",
    signIn: "साइन इन",
    proof: ["3 इंटरफ़ेस भाषाएँ", "मानव मंज़ूरी आवश्यक", "पहचान सुरक्षित"],
    journey: "शिकायत की वर्तमान यात्रा",
    waiting: "समीक्षा की प्रतीक्षा",
    sample: "स्कूल के गेट के पास गहरे गड्ढे में पानी जमा हो रहा है।",
    location: "समन्वय स्कूल रोड, पुणे",
    stages: [
      ["निजी जानकारी सुरक्षित", "पूरा हुआ"],
      ["12 नज़दीकी रिपोर्ट से जोड़ा", "साझा घटना"],
      ["प्राथमिकता और समय सुझाया", "अब मानव निर्णय"],
    ],
    services: ["सड़क", "पानी", "जल निकासी", "स्वच्छता", "बिजली", "सुरक्षा"],
    path: "एक स्पष्ट रास्ता",
    trust: "निवासी के भरोसे के लिए बनाया गया",
    steps: [
      [
        "स्वाभाविक रूप से बताएं",
        "हिंदी, मराठी या अंग्रेज़ी में लिखें या बोलें। फोटो, वीडियो या सत्यापन योग्य स्थान जोड़ें।",
      ],
      [
        "साझा घटना में जुड़ें",
        "एक ही स्थान की मिलती-जुलती रिपोर्ट पहचान उजागर किए बिना +1 के रूप में जुड़ती हैं।",
      ],
      [
        "जवाबदेह कार्रवाई देखें",
        "काम शुरू होने से पहले समीक्षक प्राथमिकता, विभाग और समाधान समय की पुष्टि करता है।",
      ],
    ],
    closing: "ऐसी नागरिक कार्यप्रणाली जिसे निवासी सच में समझ सकें।",
    synthetic:
      "यह प्रदर्शन स्पष्ट रूप से चिह्नित काल्पनिक नगरपालिका का उपयोग करता है।",
    open: "कार्यक्षेत्र खोलें",
    footer: "काल्पनिक नागरिक संचालन प्रोटोटाइप",
    disclaimer: "किसी नगरपालिका साझेदारी का दावा नहीं है।",
  },
  mr: {
    eyebrow: "सरळ आणि जबाबदार नागरी तक्रार",
    title: "तुमच्या परिसराची समस्या, योग्य विभागापर्यंत.",
    body: "लिहा, बोला किंवा नकाशावर ठिकाण निवडा. निवारण समान तक्रारी एकत्र करते, प्राधान्य आणि निराकरणाची वेळ सुचवते आणि प्रत्येक निर्णयाची जबाबदारी मानवी तपासकाकडे ठेवते.",
    cta: "समस्या नोंदवा",
    signIn: "साइन इन",
    proof: ["3 इंटरफेस भाषा", "मानवी मंजुरी आवश्यक", "ओळख सुरक्षित"],
    journey: "तक्रारीचा सध्याचा प्रवास",
    waiting: "तपासणीच्या प्रतीक्षेत",
    sample: "शाळेच्या प्रवेशद्वाराजवळील खोल खड्ड्यात पाणी साचत आहे.",
    location: "समन्वय स्कूल रोड, पुणे",
    stages: [
      ["खासगी तपशील सुरक्षित", "पूर्ण"],
      ["जवळच्या 12 अहवालांशी जोडले", "सामायिक घटना"],
      ["प्राधान्य आणि वेळ सुचवली", "पुढे मानवी निर्णय"],
    ],
    services: ["रस्ते", "पाणी", "निचरा", "स्वच्छता", "वीज", "सुरक्षा"],
    path: "एक स्पष्ट मार्ग",
    trust: "नागरिकांच्या विश्वासासाठी तयार केलेले",
    steps: [
      [
        "सहजपणे सांगा",
        "मराठी, हिंदी किंवा इंग्रजीत लिहा किंवा बोला. फोटो, व्हिडिओ किंवा पडताळता येणारे ठिकाण जोडा.",
      ],
      [
        "सामायिक घटनेत सामील व्हा",
        "एकाच ठिकाणचे समान अहवाल ओळख उघड न करता +1 म्हणून जोडले जातात.",
      ],
      [
        "जबाबदार कारवाई पाहा",
        "काम सुरू होण्यापूर्वी तपासक प्राधान्य, विभाग आणि निराकरणाची वेळ निश्चित करतो.",
      ],
    ],
    closing: "नागरिकांना खरोखर समजणारी नागरी कार्यपद्धती.",
    synthetic:
      "या प्रात्यक्षिकात स्पष्टपणे नमूद केलेली काल्पनिक नगरपालिका वापरली आहे.",
    open: "कार्यक्षेत्र उघडा",
    footer: "काल्पनिक नागरी कार्यप्रणाली नमुना",
    disclaimer: "कोणत्याही नगरपालिका भागीदारीचा दावा नाही.",
  },
} as const;
const serviceIcons = [
  Wrench,
  Droplets,
  Waves,
  Sparkles,
  Lightbulb,
  ShieldCheck,
];
const stageIcons = [ShieldCheck, Users, Bot];

export default function Home() {
  const { locale } = useLanguage();
  const c = copy[locale];
  return (
    <main className="overflow-hidden">
      <PublicHeader />
      <section className="paper-grid border-b">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:py-24">
          <div className="self-center">
            <p className="eyebrow motion-fade">{c.eyebrow}</p>
            <h1 className="display motion-rise mt-5 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">
              {c.title}
            </h1>
            <p className="motion-rise motion-delay-1 mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              {c.body}
            </p>
            <div className="motion-rise motion-delay-2 mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="hover-arrow">
                <Link href="/resident">
                  {c.cta}
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">{c.signIn}</Link>
              </Button>
            </div>
            <div className="motion-fade motion-delay-3 mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
              {c.proof.map((item) => (
                <span key={item}>
                  <Check className="mr-1.5 inline size-3.5 text-civic" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <aside className="motion-pop motion-delay-2 self-center border bg-card p-5 shadow-[8px_8px_0_var(--civic-soft)] sm:p-7">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="eyebrow">{c.journey}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  NVR-26-104827 · Ward 12
                </p>
              </div>
              <span className="rounded-full border border-civic/30 bg-civic/5 px-3 py-1 text-xs font-semibold text-civic">
                {c.waiting}
              </span>
            </div>
            <div className="py-5">
              <p className="text-lg font-semibold leading-7">{c.sample}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 text-civic" />
                {c.location}
              </p>
            </div>
            <div className="workflow-rail motion-line space-y-5 border-t pt-5">
              {c.stages.map(([label, meta], index) => {
                const Icon = stageIcons[index];
                return (
                  <div key={label} className="relative flex gap-4 motion-rise">
                    <span
                      className={`ambient-dot z-10 size-3 shrink-0 translate-y-1 rounded-full ${index === 2 ? "bg-warning" : "bg-civic"}`}
                    />
                    <Icon className="size-5 shrink-0 text-civic" />
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {meta}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </section>
      <section
        className="border-b bg-card"
        aria-label="Participating service desks"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 px-5 sm:grid-cols-3 lg:grid-cols-6 lg:px-10">
          {c.services.map((name, index) => {
            const Icon = serviceIcons[index];
            return (
              <div
                key={name}
                className="group flex items-center gap-2 border-b px-3 py-5 transition-colors hover:bg-civic/5 sm:border-r lg:border-b-0 first:border-l"
              >
                <Icon className="size-4 text-civic transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" />
                <span className="text-sm font-semibold">{name}</span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">{c.path}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {c.trust}
          </h2>
        </div>
        <div className="stagger-children mt-9 grid gap-4 md:grid-cols-3">
          {c.steps.map(([title, description], index) => (
            <article key={title} className="hover-lift border bg-card p-6">
              <span className="font-mono text-xs font-bold text-civic">
                0{index + 1}
              </span>
              <h3 className="mt-8 text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-y py-7 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold">{c.closing}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.synthetic}</p>
          </div>
          <Button asChild variant="outline" className="hover-arrow">
            <Link href="/resident">
              {c.open}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-7 text-xs text-muted-foreground lg:px-10">
          <span>
            <b className="text-foreground">Nivaran</b> · {c.footer}
          </span>
          <span>{c.disclaimer}</span>
        </div>
      </footer>
    </main>
  );
}
