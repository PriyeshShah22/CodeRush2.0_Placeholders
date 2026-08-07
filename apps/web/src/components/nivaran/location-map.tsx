"use client";

import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";

type Point = { latitude: number; longitude: number };

function MapEvents({ point, onPick }: { point: Point; onPick: (point: Point) => void }) {
  const map = useMap();
  useEffect(() => { map.flyTo([point.latitude, point.longitude], 17, { duration: .5 }); }, [map, point]);
  useMapEvents({ click: ({ latlng }) => onPick({ latitude: latlng.lat, longitude: latlng.lng }) });
  return <CircleMarker center={[point.latitude, point.longitude]} radius={9} pathOptions={{ color: "#0f766e", fillColor: "#0f766e", fillOpacity: .85 }} />;
}

export function LocationMap({ point, onPick }: { point: Point; onPick: (point: Point) => void }) {
  return <MapContainer center={[point.latitude, point.longitude]} zoom={16} scrollWheelZoom className="h-64 w-full" aria-label="Select complaint location on map">
    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <MapEvents point={point} onPick={onPick} />
  </MapContainer>;
}
