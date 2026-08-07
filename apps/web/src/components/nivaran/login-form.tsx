"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "./language-provider";

const accounts = [
  {
    role: "Resident",
    email: "resident@nivaran.local",
    password: "DemoResident!42",
    path: "/resident",
    note: "Submit, follow, and correct your reports",
  },
  {
    role: "Human reviewer",
    email: "reviewer@nivaran.local",
    password: "DemoReviewer!42",
    path: "/reviewer",
    note: "Review recommendations and make accountable decisions",
  },
  {
    role: "Department",
    email: "roads@nivaran.local",
    password: "DemoDepartment!42",
    path: "/department",
    note: "Acknowledge and complete assigned work",
  },
  {
    role: "Admin",
    email: "admin@nivaran.local",
    password: "DemoAdmin!42",
    path: "/admin",
    note: "Oversee escalations, rules, and audit",
  },
];
const accountCopy = {
  en: [
    "Resident|Submit, follow, and correct your reports",
    "Human reviewer|Review recommendations and make accountable decisions",
    "Department|Acknowledge and complete assigned work",
    "Admin|Oversee escalations, rules, and audit",
  ],
  hi: [
    "निवासी|अपनी शिकायतें दर्ज करें, देखें और सुधारें",
    "मानवीय समीक्षक|सिफारिशों की समीक्षा कर जवाबदेह निर्णय लें",
    "विभाग|सौंपे गए काम को स्वीकार और पूरा करें",
    "प्रशासक|एस्केलेशन, नियम और ऑडिट देखें",
  ],
  mr: [
    "नागरिक|तक्रारी नोंदवा, पहा आणि दुरुस्त करा",
    "मानवी समीक्षक|शिफारसी तपासून जबाबदार निर्णय घ्या",
    "विभाग|नेमलेले काम स्वीकारा आणि पूर्ण करा",
    "प्रशासक|एस्कलेशन, नियम आणि लेखापरीक्षण पहा",
  ],
} as const;

export function LoginForm() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [selected, setSelected] = useState(accounts[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await api<{
        data: { role: "resident" | "reviewer" | "department" | "admin" };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const roleHome = {
        resident: "/resident",
        reviewer: "/reviewer",
        department: "/department",
        admin: "/admin",
      } as const;
      toast.success(`Signed in as ${response.data.role}`);
      const requested = new URLSearchParams(window.location.search).get("next");
      const requestedMatchesRole =
        requested?.startsWith(`/${response.data.role}`) ||
        (response.data.role === "resident" && requested === "/track");
      const destination =
        requested && requestedMatchesRole
          ? requested
          : roleHome[response.data.role];
      router.push(destination);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }
  const selectedIndex = accounts.indexOf(selected);
  const selectedLabel = accountCopy[locale][selectedIndex].split("|")[0];
  return (
    <div className="motion-pop grid overflow-hidden border bg-card shadow-xl lg:grid-cols-[.9fr_1.1fr]">
      <aside className="bg-ink p-8 text-white lg:p-10">
        <p className="eyebrow !text-emerald-300">{t("loginRole")}</p>
        <h2 className="mt-4 text-3xl font-bold tracking-[-.04em]">
          {t("loginTitle")}
        </h2>
        <div className="mt-8 space-y-2">
          {accounts.map((account, index) => {
            const [label, note] = accountCopy[locale][index].split("|");
            return (
              <button
                type="button"
                key={account.role}
                onClick={() => setSelected(account)}
                className={`w-full border p-4 text-left transition hover:translate-x-1 ${selected.role === account.role ? "border-emerald-300 bg-white/10" : "border-white/15 hover:border-white/35 hover:bg-white/5"}`}
              >
                <span className="block font-bold">{label}</span>
                <span className="mt-1 block text-xs text-white/60">{note}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-8 flex gap-2 text-xs text-white/60">
          <ShieldCheck className="size-4 shrink-0 text-emerald-300" />
          {t("loginSeed")}
        </p>
      </aside>
      <form onSubmit={submit} className="p-8 lg:p-10">
        <div className="flex size-12 items-center justify-center bg-civic-soft">
          <LockKeyhole className="size-5 text-civic" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-[-.04em]">
          {t("continueAs")} {selectedLabel}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("loginIntro")}</p>
        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              key={`${selected.email}-email`}
              defaultValue={selected.email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              key={`${selected.password}-password`}
              defaultValue={selected.password}
            />
          </div>
          {error && (
            <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <Button className="w-full" size="lg" disabled={busy}>
            {busy ? (
              t("checking")
            ) : (
              <>
                {t("continueAs")} {selectedLabel} <Eye />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
