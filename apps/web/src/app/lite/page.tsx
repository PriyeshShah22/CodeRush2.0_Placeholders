"use client";

import Link from "next/link";
import { Brand } from "@/components/nivaran/brand";
import { ReportForm } from "@/components/nivaran/report-form";
import { useLanguage } from "@/components/nivaran/language-provider";

export default function LitePage(){const {t}=useLanguage();return <main className="mx-auto min-h-screen max-w-2xl bg-background px-4 py-5"><div className="flex items-center justify-between border-b pb-4"><Brand compact/><Link href="/" className="text-sm font-semibold underline">{t("fullSite")}</Link></div><div className="py-7"><h1 className="text-3xl font-bold tracking-[-.04em]">{t("liteTitle")}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("liteCopy")}</p><div className="mt-6"><ReportForm lite/></div></div></main>}
