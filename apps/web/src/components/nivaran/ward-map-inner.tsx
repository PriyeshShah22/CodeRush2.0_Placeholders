"use client";

import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip } from "react-leaflet";

const wardBoundary: [number, number][] = [
  [18.543, 73.827], [18.548, 73.865], [18.529, 73.886],
  [18.503, 73.878], [18.495, 73.842], [18.515, 73.821],
];

const aggregates = [
  { name: "Ward 7 · Shanti Chowk", point: [18.5204, 73.8567] as [number, number], count: 5 },
  { name: "Ward 3 · Azad Market", point: [18.531, 73.847] as [number, number], count: 3 },
  { name: "Ward 5 · Maitri School", point: [18.511, 73.867] as [number, number], count: 2 },
];

export default function WardMapInner() {
  return (
    <MapContainer center={[18.521, 73.855]} zoom={13} scrollWheelZoom={false} className="h-80 w-full" aria-label="Synthetic complaint geography">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polygon positions={wardBoundary} pathOptions={{ color: "#075e59", weight: 2, fillColor: "#8bd5c8", fillOpacity: .16 }} />
      {aggregates.map((item) => (
        <CircleMarker key={item.name} center={item.point} radius={8 + item.count} pathOptions={{ color: "#fffaf0", weight: 2, fillColor: "#b64d2e", fillOpacity: .9 }}>
          <Tooltip>{item.name} · {item.count} linked reports</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
