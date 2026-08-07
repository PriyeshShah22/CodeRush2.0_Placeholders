"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocateFixed, Loader2, MapPin, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LocationMap = dynamic(() => import("./location-map").then((module) => module.LocationMap), { ssr: false, loading: () => <div className="grid h-64 place-items-center bg-secondary text-sm text-muted-foreground">Loading map…</div> });
type Point = { latitude: number; longitude: number };
type Suggestion = Point & { display_name: string };

export function LocationPicker({ value, point, onChange, compact = false }: { value: string; point?: Point; onChange: (address: string, point?: Point) => void; compact?: boolean }) {
  const [results, setResults] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function search() {
    if (value.trim().length < 3) return;
    setBusy(true); setError("");
    try { const response = await api<{ data: Suggestion[] }>(`/locations/search?q=${encodeURIComponent(value)}`); setResults(response.data); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Address search failed"); }
    finally { setBusy(false); }
  }
  async function reverse(next: Point) {
    setBusy(true); setError("");
    try { const response = await api<{ data: Suggestion }>(`/locations/reverse?latitude=${next.latitude}&longitude=${next.longitude}`); onChange(response.data.display_name, next); setResults([]); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Address lookup failed"); }
    finally { setBusy(false); }
  }
  function detect() {
    if (!navigator.geolocation) { setError("Location detection is not supported in this browser."); return; }
    setBusy(true); setError("");
    navigator.geolocation.getCurrentPosition(({ coords }) => void reverse({ latitude: coords.latitude, longitude: coords.longitude }), () => { setBusy(false); setError("Allow location access, or search and choose the place manually."); }, { enableHighAccuracy: true, timeout: 12000 });
  }
  return <div className="space-y-3">
    <div className="flex gap-2"><div className="relative flex-1"><MapPin className="absolute left-3 top-2.5 size-4 text-civic"/><Input value={value} onChange={(event) => onChange(event.target.value, point)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} className="pl-9" placeholder="Street, landmark, neighbourhood" aria-label="Complaint location"/></div><Button type="button" variant="outline" onClick={search} disabled={busy || value.trim().length < 3}><Search/>Search</Button><Button type="button" variant="outline" onClick={detect} disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : <LocateFixed/>}<span className="hidden sm:inline">My location</span></Button></div>
    {results.length > 0 && <div className="divide-y border bg-card">{results.map((result) => <button type="button" key={`${result.latitude}-${result.longitude}`} className="block w-full p-3 text-left text-sm hover:bg-secondary" onClick={() => { onChange(result.display_name, result); setResults([]); }}>{result.display_name}</button>)}</div>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {!compact && point && <div className="overflow-hidden border"><LocationMap point={point} onPick={(next) => void reverse(next)}/><p className="border-t bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">Click the map to correct the pin. The readable address above is what reviewers see.</p></div>}
  </div>;
}
