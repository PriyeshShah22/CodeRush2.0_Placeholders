import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Fingerprint, MapPin, Route, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RoutingWorkspace({ interactive = true }: { interactive?: boolean }) {
  return <section className="overflow-hidden border bg-card shadow-[0_20px_70px_-45px_rgba(19,49,57,.45)]" aria-label="Complaint intelligence and routing workflow">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
      <div><p className="eyebrow">How an authorized reviewer works</p><h2 className="mt-1 text-lg font-bold tracking-[-.03em]">Complaint intelligence & routing</h2></div>
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900"><Users />Human review required</Badge>
    </div>
    <div className="grid lg:grid-cols-3">
      <article className="border-b p-5 lg:border-r lg:border-b-0">
        <p className="eyebrow">01 · Resident report</p><h3 className="mt-5 text-lg font-bold">Original meaning stays visible</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Typed or transcribed speech, the normalized translation, photo/video evidence, and privacy-safe operational text remain separate.</p>
        <div className="mt-5 space-y-3 border-y py-4 text-sm">
          <div className="flex gap-3"><MapPin className="mt-0.5 size-4 text-civic" /><span><b>GPS + resident landmark</b><br /><span className="text-muted-foreground">Used to find the same road or civic asset</span></span></div>
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 text-civic" /><span><b>Identity protected</b><br /><span className="text-muted-foreground">Phone number removed before AI triage</span></span></div>
        </div>
      </article>
      <article className="border-b p-5 lg:border-r lg:border-b-0">
        <p className="eyebrow">02 · AI recommendation</p><h3 className="mt-5 text-lg font-bold">Issue, priority, and shared incident</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">The system derives an urgency recommendation and raises community impact when several nearby residents report the same issue.</p>
        <div className="mt-5 border-l-2 border-civic pl-4"><p className="text-xs font-bold uppercase tracking-wider">Duplicate prevention</p><p className="mt-1 text-sm font-semibold">Similar reports are clubbed, never discarded</p><p className="mt-1 text-xs text-muted-foreground">Each resident keeps a private report and sees the shared +N count.</p></div>
      </article>
      <article className="p-5">
        <p className="eyebrow">03 · Accountable route</p><h3 className="mt-5 text-lg font-bold">One owner, multiple supporting departments</h3>
        <div className="mt-5 space-y-3"><div className="border border-civic bg-civic/5 p-3"><span className="flex items-center gap-2 font-bold"><Building2 className="size-4" />Primary service owner</span></div><div className="border p-3"><span className="flex items-center gap-2 font-bold"><Route className="size-4" />Roads · Water · Electricity · Safety</span><p className="mt-2 text-xs text-muted-foreground">Only departments eligible under configured rules can be selected.</p></div></div>
        {interactive ? <Button asChild size="sm" className="mt-6"><Link href="/login">Open reviewer workspace <ArrowRight /></Link></Button> : null}
      </article>
    </div>
    <div className="flex items-center gap-2 border-t bg-secondary/35 px-5 py-3 text-xs"><CheckCircle2 className="size-4 text-civic" /><b>Decision boundary:</b><span className="text-muted-foreground">AI recommends. A reviewer approves or records a reasoned change before assignment.</span><Fingerprint className="ms-auto size-4 text-muted-foreground" /></div>
  </section>;
}
