"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, FileImage, Loader2, Paperclip, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, API_URL, Complaint } from "@/lib/api";
import { useLanguage } from "./language-provider";
import { LocationPicker } from "./location-picker";
import { DuplicateComplaintCheck } from "./duplicate-complaint-check";
import { findNearbyIssues, NearbyIssue } from "./nearby-issues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Point = { latitude: number; longitude: number };

async function compressImage(file: File) {
  if (!file.type.startsWith("image/") || file.size < 1_500_000) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .82));
  return blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }) : file;
}

export function ReportForm({ lite = false, onSubmitted }: { lite?: boolean; onSubmitted?: (complaint: Complaint) => void }) {
  const { locale, tr } = useLanguage();
  const draftKey = lite ? "nivaran-lite-draft" : "nivaran-report-draft";
  const [description, setDescription] = useState(""); const [location, setLocation] = useState(""); const [point, setPoint] = useState<Point>();
  const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<{ reference: string; complaint: Complaint }>();
  const [matches,setMatches]=useState<NearbyIssue[]>([]); const [checked,setChecked]=useState(false); const [linking,setLinking]=useState<string>(); const [linkedIssue,setLinkedIssue]=useState<NearbyIssue>();
  useEffect(() => { const timer = setTimeout(() => { try { const saved = JSON.parse(localStorage.getItem(draftKey) || "{}"); setDescription(saved.description || ""); setLocation(saved.location || ""); if (saved.point) setPoint(saved.point); } catch {} }, 0); return () => clearTimeout(timer); }, [draftKey]);
  useEffect(() => { const timer = setTimeout(() => { if (description || location) localStorage.setItem(draftKey, JSON.stringify({ description, location, point })); }, 400); return () => clearTimeout(timer); }, [description, location, point, draftKey]);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted: File[] = [];
    for (const file of Array.from(list)) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"].includes(file.type);
      const limit = file.type.startsWith("video/") ? 25 * 1024 * 1024 : 8 * 1024 * 1024;
      if (!allowed || file.size > limit) { setError(`${file.name} ${tr("is unsupported or too large.")}`); continue; }
      accepted.push(await compressImage(file));
    }
    setFiles((current) => [...current, ...accepted].slice(0, 6));
  }

  async function upload(complaintId: string) {
    for (const file of files) {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(`${API_URL}/complaints/${complaintId}/evidence`, { method: "POST", credentials: "include", body: form });
      if (!response.ok) toast.warning(`${file.name} ${tr("could not be uploaded.")}`);
    }
  }

  function similarIssues(issues: NearbyIssue[]) {
    const words=new Set(description.toLowerCase().split(/[^a-z0-9]+/).filter((word)=>word.length>=4));
    return issues.filter((issue)=>{const candidate=`${issue.title} ${issue.category}`.toLowerCase(); return [...words].some((word)=>candidate.includes(word));}).slice(0,3);
  }

  async function createComplaint() {
    setBusy(true); setError("");
    try {
      const response = await api<{ data: { complaint: Complaint } }>("/complaints", { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ description, location_text: location, language: locale, source_channel: lite ? "lite" : "web", latitude: point?.latitude, longitude: point?.longitude }) });
      await upload(response.data.complaint.id); localStorage.removeItem(draftKey);
      setResult({ reference: response.data.complaint.reference_number, complaint: response.data.complaint }); onSubmitted?.(response.data.complaint); toast.success(tr("Complaint saved for human review"));
    } catch { setError(tr("Could not submit. Your draft is still saved.")); } finally { setBusy(false); }
  }

  async function submit() {
    if (description.trim().length < 12 || location.trim().length < 3) { setError(tr("Describe the issue and choose a verifiable location.")); return; }
    if (!checked && point) {
      setBusy(true); setError("");
      try { const candidates=similarIssues(await findNearbyIssues(point)); if (candidates.length) { setMatches(candidates); return; } setChecked(true); }
      catch { setChecked(true); }
      finally { setBusy(false); }
    }
    await createComplaint();
  }

  async function reportSame(issue: NearbyIssue) {
    if (!point) return; setLinking(issue.id); setError("");
    try {
      await api(`/community/incidents/${issue.id}/affected`,{method:"POST",body:JSON.stringify({latitude:point.latitude,longitude:point.longitude})});
      setLinkedIssue(issue); localStorage.removeItem(draftKey); toast.success(tr("Reported as the same issue. You will receive future updates."));
    } catch { setError(tr("Could not link to this issue")); }
    finally { setLinking(undefined); }
  }

  if (result) return <div className="border bg-card p-7"><span className="grid size-10 place-items-center rounded-full bg-civic text-white"><Check /></span><h2 className="mt-5 text-2xl font-bold">{tr("Complaint filed")}</h2><p className="mt-2 font-mono text-civic">{result.reference}</p><p className="mt-3 text-sm text-muted-foreground">{tr("AI will recommend urgency and departments. A reviewer must approve them before assignment.")}</p><Button asChild variant="outline" className="mt-5"><Link href={`/resident/complaints/${result.complaint.id}`}>{tr("View complaint")}</Link></Button></div>;
  if (linkedIssue) return <div className="border bg-card p-7"><span className="grid size-10 place-items-center rounded-full bg-civic text-white"><Check /></span><h2 className="mt-5 text-2xl font-bold">{tr("Reported as the same issue")}</h2><p className="mt-2 text-sm font-semibold">{linkedIssue.title}</p><p className="mt-3 text-sm text-muted-foreground">{tr("No duplicate complaint was created. You are linked to the existing community incident and will receive future updates.")}</p></div>;
  if (matches.length) return <DuplicateComplaintCheck issues={matches} busy={linking} onSame={(issue)=>void reportSame(issue)} onBack={()=>{setMatches([]);setChecked(false);}} onContinue={()=>{setMatches([]);setChecked(true);void createComplaint();}}/>;

  return <div className="border bg-card p-5 sm:p-7"><div><Label htmlFor="description" className="text-base font-bold">{tr("What happened?")}</Label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-32" placeholder={tr("Describe the civic issue in your own words…")} /></div><div className="mt-6"><Label className="text-base font-bold">{tr("Where is it?")}</Label><p className="mt-1 text-xs text-muted-foreground">{tr("Use GPS, search an address, or click the map. You can correct the readable address before submitting.")}</p><div className="mt-3"><LocationPicker value={location} point={point} onChange={(address, next) => { setLocation(address); if (next) setPoint(next); }} compact={lite} /></div></div>{!lite && <div className="mt-6"><div className="flex items-center gap-2"><FileImage className="size-4 text-civic" /><Label htmlFor="evidence" className="font-bold">{tr("Photos or video")}</Label></div><Input id="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="mt-3" onChange={(event) => void addFiles(event.target.files)} />{files.length > 0 && <div className="mt-3 divide-y border">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 text-sm"><span className="truncate"><Paperclip className="mr-2 inline size-4" />{file.name}</span><Button type="button" size="icon" variant="ghost" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div>)}</div>}</div>}<div className="mt-6 flex items-center justify-between gap-4 border-t pt-5"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Save className="size-4" />{tr("Draft saved on this device")}</p><Button onClick={() => void submit()} disabled={busy}>{busy && <Loader2 className="animate-spin" />}{busy ? tr("Submitting…") : tr("Submit complaint")}</Button></div>{error && <p role="alert" className="mt-4 bg-red-50 p-3 text-sm text-red-800">{error}</p>}</div>;
}
