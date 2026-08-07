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
    body: "Type it, speak it, or point to it on a map. Nivaran brings repeat reports together, recommends urgency, and keeps a human responsible for every decision.",
    cta: "Report an issue",
    expectations: "Built around resident trust",
  },
  hi: {
    eyebrow: "सीधी और जवाबदेह नागरिक शिकायत",
    title: "आपके इलाके की समस्या, सही विभाग तक।",
    body: "लिखें, बोलें या नक्शे पर स्थान चुनें। निवारण मिलती-जुलती शिकायतों को जोड़ता है, प्राथमिकता सुझाता है और हर निर्णय की जिम्मेदारी मानव समीक्षक के पास रखता है।",
    cta: "समस्या दर्ज करें",
    expectations: "निवासी के भरोसे के लिए बनाया गया",
  },
  mr: {
    eyebrow: "सरळ आणि जबाबदार नागरी तक्रार",
    title: "तुमच्या परिसराची समस्या, योग्य विभागापर्यंत.",
    body: "लिहा, बोला किंवा नकाशावर ठिकाण निवडा. निवारण समान तक्रारी एकत्र करते, प्राधान्य सुचवते आणि प्रत्येक निर्णयाची जबाबदारी मानवी तपासकाकडे ठेवते.",
    cta: "समस्या नोंदवा",
    expectations: "नागरिकांच्या विश्वासासाठी तयार केलेले",
  },
};

const services = [
  [Wrench, "Roads"],
  [Droplets, "Water"],
  [Waves, "Drainage"],
  [Sparkles, "Sanitation"],
  [Lightbulb, "Electrical"],
  [ShieldCheck, "Safety"],
] as const;

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
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <div className="motion-fade motion-delay-3 mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
              <span>
                <Check className="mr-1.5 inline size-3.5 text-civic" />3
                interface languages
              </span>
              <span>
                <Check className="mr-1.5 inline size-3.5 text-civic" />
                Human approval required
              </span>
              <span>
                <Check className="mr-1.5 inline size-3.5 text-civic" />
                Identity protected
              </span>
            </div>
          </div>
          <aside className="motion-pop motion-delay-2 self-center border bg-card p-5 shadow-[8px_8px_0_var(--civic-soft)] sm:p-7">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="eyebrow">Live complaint journey</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  NVR-26-104827 · Ward 12
                </p>
              </div>
              <span className="rounded-full border border-civic/30 bg-civic/5 px-3 py-1 text-xs font-semibold text-civic">
                Awaiting review
              </span>
            </div>
            <div className="py-5">
              <p className="text-lg font-semibold leading-7">
                Water collecting around a deep pothole near the school gate.
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 text-civic" />
                Samanvay School Road, Pune
              </p>
            </div>
            <div className="workflow-rail motion-line space-y-5 border-t pt-5">
              {[
                [ShieldCheck, "Private details protected", "Completed"],
                [Users, "Matched with 12 nearby reports", "Shared incident"],
                [Bot, "Urgency suggested for review", "Human decision next"],
              ].map(([Icon, label, meta], index) => (
                <div
                  key={label as string}
                  className="relative flex gap-4 motion-rise"
                >
                  <span
                    className={`ambient-dot z-10 size-3 shrink-0 translate-y-1 rounded-full ${index === 2 ? "bg-warning" : "bg-civic"}`}
                  />
                  <Icon className="size-5 shrink-0 text-civic" />
                  <div>
                    <p className="text-sm font-semibold">{label as string}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {meta as string}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
      <section
        className="border-b bg-card"
        aria-label="Participating service desks"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 px-5 sm:grid-cols-3 lg:grid-cols-6 lg:px-10">
          {services.map(([Icon, name]) => (
            <div
              key={name}
              className="group flex items-center gap-2 border-b px-3 py-5 transition-colors hover:bg-civic/5 sm:border-r lg:border-b-0 first:border-l"
            >
              <Icon className="size-4 text-civic transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" />
              <span className="text-sm font-semibold">{name}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">One clear path</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {c.expectations}
          </h2>
        </div>
        <div className="stagger-children mt-9 grid gap-4 md:grid-cols-3">
          {[
            [
              "01",
              "Tell us naturally",
              "Type or speak in English, Hindi, or Marathi. Add a photo, video, or a location you can verify.",
            ],
            [
              "02",
              "Join the shared incident",
              "Nearby reports about the same place are grouped without exposing who made them.",
            ],
            [
              "03",
              "Follow accountable action",
              "A reviewer confirms priority and departments before work begins. Every update stays on your timeline.",
            ],
          ].map(([number, title, text]) => (
            <article key={number} className="hover-lift border bg-card p-6">
              <span className="font-mono text-xs font-bold text-civic">
                {number}
              </span>
              <h3 className="mt-8 text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-y py-7 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold">
              A civic workflow residents can actually follow.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This demonstration uses a clearly labelled synthetic municipality.
            </p>
          </div>
          <Button asChild variant="outline" className="hover-arrow">
            <Link href="/resident">
              Open workspace
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-7 text-xs text-muted-foreground lg:px-10">
          <span>
            <b className="text-foreground">Nivaran</b> · Synthetic civic
            operations prototype
          </span>
          <span>No municipality partnership is implied.</span>
        </div>
      </footer>
    </main>
  );
}
