"use client";

import { PublicHeader } from "@/components/nivaran/brand";
import { ReportForm } from "@/components/nivaran/report-form";
import { useLanguage } from "@/components/nivaran/language-provider";

export default function ReportPage(){const {t}=useLanguage();return <main><PublicHeader/><div className="paper-grid min-h-screen px-5 py-10"><div className="mx-auto max-w-5xl"><p className="eyebrow">{t("reportEyebrow")}</p><h1 className="mt-3 text-4xl font-bold tracking-[-.045em]">{t("reportTitle")}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{t("reportCopy")}</p><div className="mt-8"><ReportForm/></div></div></div></main>}
