"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  FilePlus2,
  ListChecks,
  Users,
} from "lucide-react";
import { useLanguage } from "./language-provider";
import { ReportForm } from "./report-form";
import { ComplaintAssistant } from "./complaint-assistant";
import { NearbyIssues } from "./nearby-issues";
import { MyComplaints } from "./my-complaints";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const dashboardCopy = {
  en: {
    eyebrow: "Private resident workspace",
    title: "Report and follow civic issues",
    intro: "Your complaints stay inside this signed-in account.",
    mine: "My complaints",
    report: "Report issue",
    assistant: "AI assistant",
    nearby: "Nearby issues",
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
    nearby: "मेरे पास",
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
    nearby: "माझ्याजवळ",
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
  const [tab, setTab] = useState("complaints");
  const [refreshKey,setRefreshKey]=useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.location.hash === "#report") setTab("report");
      if (window.location.hash === "#assistant") setTab("assistant");
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function filed() {
    setRefreshKey(value=>value+1);
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
          <TabsTrigger value="nearby" className="px-4 py-2">
            <Users />
            {c.nearby}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="complaints" className="mt-6">
          <MyComplaints refreshKey={refreshKey}/>
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <ReportForm onSubmitted={filed} />
        </TabsContent>
        <TabsContent value="assistant" className="mt-6">
          <ComplaintAssistant onFiled={filed} />
        </TabsContent>
        <TabsContent value="nearby" className="mt-6">
          <NearbyIssues />
        </TabsContent>
      </Tabs>
    </div>
  );
}
