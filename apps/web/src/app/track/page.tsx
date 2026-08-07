"use client";

import { PublicHeader } from "@/components/nivaran/brand";
import { TrackForm } from "@/components/nivaran/track-form";
import { useLanguage } from "@/components/nivaran/language-provider";

export default function TrackPage(){const {t}=useLanguage();return <main><PublicHeader/><div className="paper-grid min-h-[calc(100vh-72px)] px-5 py-12"><div className="mx-auto max-w-5xl"><p className="eyebrow">{t("trackEyebrow")}</p><h1 className="mt-3 text-4xl font-bold tracking-[-.045em]">{t("trackTitle")}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{t("trackCopy")}</p><div className="mt-8"><TrackForm/></div></div></div></main>}
