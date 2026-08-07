"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./ward-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-80 place-items-center bg-secondary text-sm text-muted-foreground">
      Loading complaint map…
    </div>
  ),
});

export type ComplaintMapPoint = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  count: number;
  category: string;
  status: string;
};

export function WardMap({ points }: { points: ComplaintMapPoint[] }) {
  return (
    <section className="mt-5 border bg-card p-5">
      <p className="eyebrow">Live complaint geography</p>
      <div className="mt-3 overflow-hidden border">
        <Map points={points} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Markers come from persisted complaint coordinates. Similar nearby
        reports share one marker and a +count; reporter identity is never shown.
      </p>
    </section>
  );
}
