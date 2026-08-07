"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  FilePlus2,
  ListChecks,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { api, Complaint } from "@/lib/api";
import { useLanguage } from "./language-provider";
import { ReportForm } from "./report-form";
import { ComplaintAssistant } from "./complaint-assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const dashboardCopy = {
  en: {
    eyebrow: "Private resident workspace",
    title: "Report and follow civic issues",
    intro: "Your complaints stay inside this signed-in account.",
    mine: "My complaints",
    report: "Report issue",
    assistant: "AI assistant",
    load: "We could not load your complaints.",
    retry: "Try again",
    empty: "No complaints yet",
    emptyCopy: "Use the short form or talk to the filing assistant.",
    similar: "similar reports",
  },
  hi: {
    eyebrow: "निजी निवासी कार्यक्षेत्र",
    title: "नागरिक समस्याएँ दर्ज करें और देखें",
    intro: "आपकी शिकायतें केवल इस साइन-इन खाते में रहती हैं।",
    mine: "मेरी शिकायतें",
    report: "समस्या दर्ज करें",
    assistant: "AI सहायक",
    load: "आपकी शिकायतें लोड नहीं हो सकीं।",
    retry: "फिर प्रयास करें",
    empty: "अभी कोई शिकायत नहीं",
    emptyCopy: "छोटा फ़ॉर्म भरें या शिकायत सहायक से बात करें।",
    similar: "मिलती-जुलती रिपोर्ट",
  },
  mr: {
    eyebrow: "खासगी नागरिक कार्यक्षेत्र",
    title: "नागरी समस्या नोंदवा आणि पाहा",
    intro: "तुमच्या तक्रारी फक्त या साइन-इन खात्यात राहतात.",
    mine: "माझ्या तक्रारी",
    report: "समस्या नोंदवा",
    assistant: "AI सहाय्यक",
    load: "तुमच्या तक्रारी लोड होऊ शकल्या नाहीत.",
    retry: "पुन्हा प्रयत्न करा",
    empty: "अद्याप तक्रार नाही",
    emptyCopy: "लहान फॉर्म वापरा किंवा तक्रार सहाय्यकाशी बोला.",
    similar: "समान अहवाल",
  },
} as const;

export function ResidentDashboard() {
  const { locale } = useLanguage();
  const c = dashboardCopy[locale];
  const [rows, setRows] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("complaints");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api<{ data: Complaint[] }>("/complaints");
      setRows(response.data);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Complaints unavailable",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    api<{ data: Complaint[] }>("/complaints")
      .then((response) => setRows(response.data))
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Complaints unavailable",
        ),
      )
      .finally(() => setLoading(false));
    const timer = setTimeout(() => {
      if (window.location.hash === "#report") setTab("report");
      if (window.location.hash === "#assistant") setTab("assistant");
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function displayText(complaint: Complaint) {
    if (locale === "hi" && complaint.translation_hi)
      return complaint.translation_hi;
    if (locale === "mr" && complaint.translation_mr)
      return complaint.translation_mr;
    return complaint.normalized_text || complaint.safe_text;
  }
  function filed() {
    void load();
    setTab("complaints");
  }
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow">{c.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">
          {c.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{c.intro}</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-secondary p-1 sm:w-auto">
          <TabsTrigger value="complaints" className="px-4 py-2">
            <ListChecks />
            {c.mine}
          </TabsTrigger>
          <TabsTrigger value="report" className="px-4 py-2">
            <FilePlus2 />
            {c.report}
          </TabsTrigger>
          <TabsTrigger value="assistant" className="px-4 py-2">
            <Bot />
            {c.assistant}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="complaints" className="mt-6">
          {loading ? (
            <div className="grid min-h-48 place-items-center border bg-card">
              <Loader2 className="animate-spin text-civic" />
            </div>
          ) : error ? (
            <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">
              <b>{c.load}</b>
              <p className="mt-2">{error}</p>
              <Button variant="outline" className="mt-4" onClick={load}>
                {c.retry}
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="border bg-card p-8 text-center">
              <ShieldCheck className="mx-auto size-7 text-civic" />
              <h3 className="mt-4 text-xl font-bold">{c.empty}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {c.emptyCopy}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((complaint) => (
                <Link
                  href={`/resident/complaints/${complaint.id}`}
                  key={complaint.id}
                  className="hover-lift hover-arrow grid gap-4 border bg-card p-5 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-civic">
                        {complaint.reference_number}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {complaint.status.replaceAll("_", " ")}
                      </Badge>
                      {(complaint.linked_reports || 1) > 1 ? (
                        <Badge variant="secondary">
                          +{(complaint.linked_reports || 1) - 1} {c.similar}
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-base font-bold">
                      {displayText(complaint)}
                    </h3>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {complaint.location_text}
                    </p>
                  </div>
                  <ArrowRight className="size-5 text-civic" />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <ReportForm onSubmitted={filed} />
        </TabsContent>
        <TabsContent value="assistant" className="mt-6">
          <ComplaintAssistant onFiled={filed} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
