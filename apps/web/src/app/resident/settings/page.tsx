import { PortalShell } from "@/components/nivaran/portal-shell";import { SettingsForm } from "@/components/nivaran/settings-form";
export default function SettingsPage(){return <PortalShell role="resident" title="Preferences"><div className="mx-auto max-w-3xl"><p className="eyebrow">Resident controls</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Language, access, and consent</h2><SettingsForm/></div></PortalShell>}

