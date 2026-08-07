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

export function ResidentDashboard() {
  const { locale } = useLanguage();
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
        <p className="eyebrow">Private resident workspace</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">
          Report and follow civic issues
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your complaints stay inside this signed-in account.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-secondary p-1 sm:w-auto">
          <TabsTrigger value="complaints" className="px-4 py-2">
            <ListChecks />
            My complaints
          </TabsTrigger>
          <TabsTrigger value="report" className="px-4 py-2">
            <FilePlus2 />
            Report issue
          </TabsTrigger>
          <TabsTrigger value="assistant" className="px-4 py-2">
            <Bot />
            AI assistant
          </TabsTrigger>
        </TabsList>
        <TabsContent value="complaints" className="mt-6">
          {loading ? (
            <div className="grid min-h-48 place-items-center border bg-card">
              <Loader2 className="animate-spin text-civic" />
            </div>
          ) : error ? (
            <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">
              <b>We could not load your complaints.</b>
              <p className="mt-2">{error}</p>
              <Button variant="outline" className="mt-4" onClick={load}>
                Try again
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="border bg-card p-8 text-center">
              <ShieldCheck className="mx-auto size-7 text-civic" />
              <h3 className="mt-4 text-xl font-bold">No complaints yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Use the short form or talk to the filing assistant.
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
