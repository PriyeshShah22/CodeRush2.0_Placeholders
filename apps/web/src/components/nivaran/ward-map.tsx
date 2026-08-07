"use client";

import dynamic from "next/dynamic";
import { useLanguage } from "./language-provider";

const Map = dynamic(() => import("./ward-map-inner"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse bg-secondary" />,
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
  const { tr } = useLanguage();
  return (
    <section className="mt-5 border bg-card p-5">
      <p className="eyebrow">{tr("Live complaint geography")}</p>
      <div className="mt-3 overflow-hidden border">
        <Map points={points} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {tr(
          "Markers come from persisted complaint coordinates. Similar nearby reports share one marker and a +count; reporter identity is never shown.",
        )}
      </p>
    </section>
  );
}
