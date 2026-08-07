"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Locale, useLanguage } from "./language-provider";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-3" aria-label="Nivaran home"><span className="grid size-9 place-items-center bg-ink text-sm font-black text-white">नि</span><span><span className="block text-lg font-extrabold tracking-[-.04em]">Nivaran</span>{!compact && <span className="block text-[10px] uppercase tracking-[.15em] text-muted-foreground">Community redressal</span>}</span></Link>;
}

function LanguagePicker() {
  const { locale, setLocale } = useLanguage();
  const options: { code: Locale; label: string }[] = [{ code: "en", label: "EN" }, { code: "hi", label: "हिन्दी" }, { code: "mr", label: "मराठी" }];
  return <div className="flex border" role="group" aria-label="Interface language">{options.map(({ code, label }) => <button key={code} type="button" aria-pressed={locale === code} onClick={() => setLocale(code)} className={`px-2 py-1.5 text-[11px] font-bold ${locale === code ? "bg-ink text-white" : "bg-background text-muted-foreground hover:text-foreground"}`}>{label}</button>)}</div>;
}

export function PublicHeader() {
  const { t } = useLanguage(); const router = useRouter(); const [user, setUser] = useState<{ role: string } | null>(null);
  useEffect(() => { api<{ data: { role: string } }>("/auth/me").then((response) => setUser(response.data)).catch(() => setUser(null)); }, []);
  async function logout() { try { await api("/auth/logout", { method: "POST" }); } finally { setUser(null); router.push("/login"); router.refresh(); } }
  const home = user ? `/${user.role}` : "/login";
  return <header className="border-b bg-background/95"><div className="mx-auto flex min-h-18 max-w-[1440px] items-center justify-between gap-3 px-5 py-3 lg:px-10"><Brand /><nav className="hidden items-center gap-7 text-sm font-semibold md:flex" aria-label="Primary navigation">{user?.role === "resident" && <><Link href="/resident/report">{t("report")}</Link><Link href="/lite">{t("lite")}</Link><Link href="/sms">{t("sms")}</Link></>}</nav><div className="flex items-center gap-2"><LanguagePicker />{user ? <><Button asChild size="sm" variant="outline"><Link href={home}>{t("myComplaints")}</Link></Button><Button size="icon" variant="ghost" aria-label={t("signOut")} onClick={logout}><LogOut /></Button></> : <Button asChild size="sm"><Link href="/login">{t("signIn")}</Link></Button>}</div></div></header>;
}

export function TrustStrip() {
  const { locale, t } = useLanguage();
  return <div className="border-y bg-secondary/45"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-muted-foreground lg:px-10"><span className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="size-4 text-civic" />{t("synthetic")}</span><span>{locale === "en" ? "No report is silently rejected by AI" : locale === "hi" ? "AI किसी शिकायत को चुपचाप अस्वीकार नहीं करता" : "AI कोणतीही तक्रार गुपचूप नाकारत नाही"}</span><span>{locale === "en" ? "Reporter identity is access-controlled" : locale === "hi" ? "शिकायतकर्ता की पहचान सुरक्षित है" : "तक्रारदाराची ओळख प्रवेश-नियंत्रित आहे"}</span></div></div>;
}
