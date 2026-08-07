"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./ward-map-inner"), {
  ssr: false,
  loading: () => <div className="grid h-80 place-items-center bg-secondary text-sm text-muted-foreground">Loading ward geography…</div>,
});

export function WardMap() {
  return (
    <section className="mt-5 border bg-card p-5">
      <p className="eyebrow">Synthetic ward geography</p>
      <div className="mt-3 overflow-hidden border"><Map /></div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Markers show aggregated civic locations, never a reporter’s exact residence. Geography and boundaries are synthetic.</p>
    </section>
  );
}
