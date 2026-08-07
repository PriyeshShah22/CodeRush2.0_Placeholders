"use client";

import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import type { ComplaintMapPoint } from "./ward-map";
import { useLanguage } from "./language-provider";

const wardBoundary: [number, number][] = [
  [18.543, 73.827],
  [18.548, 73.865],
  [18.529, 73.886],
  [18.503, 73.878],
  [18.495, 73.842],
  [18.515, 73.821],
];

export default function WardMapInner({
  points,
}: {
  points: ComplaintMapPoint[];
}) {
  const { tr, category } = useLanguage();
  return (
    <MapContainer
      center={[18.521, 73.855]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-80 w-full"
      aria-label={tr("Persisted complaint geography")}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polygon
        positions={wardBoundary}
        pathOptions={{
          color: "#075e59",
          weight: 2,
          fillColor: "#8bd5c8",
          fillOpacity: 0.16,
        }}
      />
      {points.map((item) => (
        <CircleMarker
          key={item.id}
          center={[item.latitude, item.longitude]}
          radius={7 + Math.min(item.count, 8)}
          pathOptions={{
            color: "#fffaf0",
            weight: 2,
            fillColor: item.status === "resolved" ? "#0f766e" : "#b64d2e",
            fillOpacity: 0.9,
          }}
        >
          <Tooltip>
            {item.label} · {category(item.category)} ·{" "}
            {item.count === 1
              ? tr("1 report")
              : tr("+{count} similar reports", { count: item.count - 1 })}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
