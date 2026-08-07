"use client";

import { PublicHeader } from "@/components/nivaran/brand";
import { SmsTerminal } from "@/components/nivaran/sms-terminal";
import { useLanguage } from "@/components/nivaran/language-provider";

export default function SmsPage(){const {t}=useLanguage();return <main><PublicHeader/><div className="paper-grid min-h-screen px-5 py-12"><div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2"><div><p className="eyebrow">SMS-style simulator</p><h1 className="display mt-4 text-5xl">{t("smsTitle")}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{t("smsCopy")}</p></div><SmsTerminal/></div></div></main>}
