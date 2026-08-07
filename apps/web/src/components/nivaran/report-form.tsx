"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  FileImage,
  LocateFixed,
  Loader2,
  MapPin,
  Mic,
  Paperclip,
  Save,
  ShieldCheck,
  Square,
  Trash2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { api, API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "./language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const copy = {
  en: { issue: "Issue", location: "Location", evidence: "Language & evidence", review: "Review & submit", what: "What happened?", natural: "Type naturally in English, Hindi, Marathi, or a mix — or record your complaint below.", where: "Where is the issue?", landmark: "Landmark, road, neighbourhood, or ward", gps: "Use my current location", gpsReady: "GPS coordinates attached", voice: "Speak your complaint", consent: "I consent to sending this recording for transcription", record: "Record", stop: "Stop", transcribe: "Transcribe into complaint", transcribing: "Transcribing…", attachments: "Photo or video evidence", attachHelp: "JPEG, PNG, WebP, MP4, or WebM. Images are compressed on this device.", priority: "AI recommends urgency and priority; a human reviewer must approve or change it before assignment.", submit: "Submit report", back: "Back", next: "Continue", recorded: "Report safely recorded", track: "Open private tracking", reference: "Reference", pin: "Tracking PIN", saved: "This complaint is private to your account. Similar reports at the same location may be clubbed into one incident without exposing resident identity.", draft: "Draft saved on this device" },
  hi: { issue: "समस्या", location: "स्थान", evidence: "भाषा और प्रमाण", review: "जाँचें और जमा करें", what: "क्या हुआ है?", natural: "हिंदी, मराठी, अंग्रेज़ी या मिली-जुली भाषा में लिखें — या नीचे बोलकर शिकायत दर्ज करें।", where: "समस्या कहाँ है?", landmark: "पहचान-चिह्न, सड़क, मोहल्ला या वार्ड", gps: "मेरा वर्तमान स्थान लें", gpsReady: "GPS स्थान जुड़ गया", voice: "बोलकर शिकायत करें", consent: "मैं रिकॉर्डिंग को लिप्यंतरण के लिए भेजने की सहमति देता/देती हूँ", record: "रिकॉर्ड करें", stop: "रोकें", transcribe: "शिकायत में लिखें", transcribing: "लिप्यंतरण हो रहा है…", attachments: "फोटो या वीडियो प्रमाण", attachHelp: "JPEG, PNG, WebP, MP4 या WebM। फोटो इसी डिवाइस पर छोटे किए जाते हैं।", priority: "AI तात्कालिकता और प्राथमिकता सुझाएगा; विभाग को भेजने से पहले मानव समीक्षक की मंज़ूरी ज़रूरी है।", submit: "शिकायत जमा करें", back: "पीछे", next: "आगे", recorded: "शिकायत सुरक्षित रूप से दर्ज हुई", track: "निजी स्थिति देखें", reference: "संदर्भ", pin: "ट्रैकिंग PIN", saved: "यह शिकायत आपके खाते तक निजी है। पहचान उजागर किए बिना समान स्थान की शिकायतें एक घटना में जोड़ी जा सकती हैं।", draft: "मसौदा इस डिवाइस पर सुरक्षित है" },
  mr: { issue: "समस्या", location: "ठिकाण", evidence: "भाषा आणि पुरावे", review: "तपासा आणि सादर करा", what: "काय घडले?", natural: "मराठी, हिंदी, इंग्रजी किंवा मिश्र भाषेत लिहा — किंवा खाली बोलून तक्रार नोंदवा.", where: "समस्या कुठे आहे?", landmark: "खूण, रस्ता, परिसर किंवा प्रभाग", gps: "माझे सध्याचे ठिकाण वापरा", gpsReady: "GPS ठिकाण जोडले", voice: "बोलून तक्रार करा", consent: "ही ध्वनिमुद्रिका लिप्यंतरणासाठी पाठवण्यास माझी संमती आहे", record: "रेकॉर्ड करा", stop: "थांबा", transcribe: "तक्रारीत लिहा", transcribing: "लिप्यंतरण सुरू आहे…", attachments: "फोटो किंवा व्हिडिओ पुरावा", attachHelp: "JPEG, PNG, WebP, MP4 किंवा WebM. फोटो याच उपकरणावर संकुचित होतात.", priority: "AI तातडी आणि प्राधान्य सुचवेल; विभागाकडे पाठवण्यापूर्वी मानवी तपासकाची मंजुरी आवश्यक आहे.", submit: "तक्रार सादर करा", back: "मागे", next: "पुढे", recorded: "तक्रार सुरक्षितपणे नोंदली", track: "खाजगी स्थिती पाहा", reference: "संदर्भ", pin: "मागोवा PIN", saved: "ही तक्रार तुमच्या खात्यासाठी खाजगी आहे. ओळख उघड न करता समान ठिकाणच्या तक्रारी एका घटनेत जोडल्या जाऊ शकतात.", draft: "मसुदा या उपकरणावर सुरक्षित आहे" },
} as const;

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type === "image/png" ? "image/png" : "image/jpeg", 0.82));
  bitmap.close();
  return blob ? new File([blob], file.name, { type: blob.type, lastModified: file.lastModified }) : file;
}

export function ReportForm({ lite = false }: { lite?: boolean }) {
  const { locale } = useLanguage();
  const c = copy[locale];
  const l = (english: string, hindi: string, marathi: string) => locale === "hi" ? hindi : locale === "mr" ? marathi : english;
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("auto");
  const [latitude, setLatitude] = useState<number>();
  const [longitude, setLongitude] = useState<number>();
  const [locating, setLocating] = useState(false);
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ reference: string; pin: string } | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const draftKey = lite ? "nivaran-lite-draft" : "nivaran-report-draft";

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || "{}");
        setDescription(draft.description || "");
        setLocation(draft.location || "");
        setLanguage(draft.language || "auto");
      } catch { /* Ignore an invalid local draft. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, [draftKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (description || location) localStorage.setItem(draftKey, JSON.stringify({ description, location, language, savedAt: new Date().toISOString() }));
    }, 400);
    return () => clearTimeout(timer);
  }, [description, location, language, draftKey]);

  async function toggleRecording() {
    setError("");
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const next = new MediaRecorder(stream);
      next.ondataavailable = (event) => event.data.size && chunks.current.push(event.data);
      next.onstop = () => {
        setAudio(new Blob(chunks.current, { type: next.mimeType || "audio/webm" }));
        stream.getTracks().forEach((track) => track.stop());
      };
      next.start();
      recorder.current = next;
      setRecording(true);
    } catch {
      setError("Microphone access is blocked. Allow it in the browser, or continue by typing.");
    }
  }

  async function transcribeRecording() {
    if (!audio || !consent) return;
    setTranscribing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", audio, "resident-report.webm");
      const response = await fetch(`${API_URL}/voice/transcribe-preview`, { method: "POST", credentials: "include", headers: { "X-Voice-Consent": "true" }, body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "Voice transcription is unavailable.");
      setDescription(payload.data.safe_text || payload.data.transcript);
      toast.success("Voice complaint transcribed. You can edit the text before submitting.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Voice transcription is unavailable.");
    } finally {
      setTranscribing(false);
    }
  }

  function detectLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("This browser does not support automatic location detection.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        if (!location) setLocation(`GPS location · ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
        setLocating(false);
      },
      () => {
        setError("Location access is blocked. Allow it in the browser or enter a landmark.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function addEvidence(files: FileList | null) {
    if (!files) return;
    setError("");
    const next: File[] = [];
    for (const file of Array.from(files)) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"].includes(file.type);
      const limit = file.type.startsWith("video/") ? 25 * 1024 * 1024 : 8 * 1024 * 1024;
      if (!allowed || file.size > limit) {
        setError(`${file.name} is not an accepted file or exceeds the size limit.`);
        continue;
      }
      next.push(await compressImage(file));
    }
    setAttachments((current) => [...current, ...next].slice(0, 6));
  }

  async function uploadEvidence(complaintId: string, files: File[]) {
    let failures = 0;
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${API_URL}/complaints/${complaintId}/evidence`, { method: "POST", credentials: "include", body: form });
      if (!response.ok) failures += 1;
    }
    if (failures) toast.warning(`Complaint saved, but ${failures} attachment${failures > 1 ? "s" : ""} could not be uploaded.`);
  }

  async function submit() {
    if (description.trim().length < 12 || location.trim().length < 3) {
      setError("Add a little more detail and a nearby location.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = await api<{ data: { complaint: { id: string; reference_number: string }; tracking_pin: string } }>("/complaints", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ description, location_text: location, language, latitude, longitude, source_channel: audio ? "voice" : lite ? "lite" : "web", voice_processing_consent: consent }),
      });
      const files = [...attachments];
      if (audio) files.push(new File([audio], "resident-report.webm", { type: audio.type || "audio/webm" }));
      await uploadEvidence(payload.data.complaint.id, files);
      setResult({ reference: payload.data.complaint.reference_number, pin: payload.data.tracking_pin });
      localStorage.removeItem(draftKey);
      toast.success("Report saved safely");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit. Your draft remains on this device.");
    } finally {
      setBusy(false);
    }
  }

  if (result) return (
    <div className="border bg-card p-8">
      <div className="grid size-12 place-items-center bg-civic text-white"><Check /></div>
      <p className="eyebrow mt-8">{c.recorded}</p>
      <div className="mt-6 grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-background p-5"><span className="text-xs text-muted-foreground">{c.reference}</span><strong className="mt-2 block font-mono text-xl">{result.reference}</strong></div>
        <div className="bg-background p-5"><span className="text-xs text-muted-foreground">{c.pin}</span><strong className="mt-2 block font-mono text-xl">{result.pin}</strong></div>
      </div>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">{c.saved}</p>
      <Button asChild className="mt-6"><Link href="/track">{c.track} <ChevronRight /></Link></Button>
    </div>
  );

  const steps = [c.issue, c.location, c.evidence, c.review];
  return (
    <div className={`grid overflow-hidden border bg-card ${lite ? "" : "lg:grid-cols-[.68fr_1.32fr]"}`}>
      {!lite && <aside className="bg-ink p-7 text-white">
        <p className="eyebrow !text-emerald-300">{l("One report. One accountable incident.", "एक शिकायत। एक जवाबदेह घटना।", "एक तक्रार. एक जबाबदार घटना.")}</p>
        <div className="mt-8 space-y-6">{steps.map((title, index) => <div key={title} className={`flex items-center gap-3 ${step >= index + 1 ? "text-white" : "text-white/40"}`}><span className={`grid size-7 place-items-center rounded-full border text-xs ${step >= index + 1 ? "border-emerald-300 bg-emerald-300 text-ink" : "border-white/30"}`}>{step > index + 1 ? <Check className="size-3" /> : index + 1}</span><b className="text-sm">{title}</b></div>)}</div>
        <div className="mt-10 border-t border-white/15 pt-6 text-xs leading-5 text-white/60"><ShieldCheck className="mb-3 size-5 text-emerald-300" />{l("Your identity stays separate from the operational complaint. Exact coordinates are never shown publicly.", "आपकी पहचान कार्य संबंधी शिकायत से अलग रहती है। सटीक स्थान सार्वजनिक नहीं होता।", "तुमची ओळख कामाच्या तक्रारीपासून वेगळी राहते. अचूक ठिकाण सार्वजनिक केले जात नाही.")}</div>
      </aside>}
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between"><p className="eyebrow">{lite ? l("Lite intake · low bandwidth", "लाइट शिकायत · कम डेटा", "लाइट तक्रार · कमी डेटा") : `${l("Step", "चरण", "टप्पा")} ${step} / 4`}</p>{lite && <span className="flex items-center gap-1 text-xs text-muted-foreground"><WifiOff className="size-3" /> {c.draft}</span>}</div>

        {(lite || step === 1) && <div className="mt-6">
          <Label htmlFor="description" className="text-base font-bold">{c.what}</Label>
          <p className="mt-1 text-sm text-muted-foreground">{c.natural}</p>
          <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} className="mt-3 min-h-40 text-base" placeholder={l("Describe what you can see, the road or landmark, and who is affected…", "जो दिख रहा है, सड़क या पहचान-चिह्न और प्रभावित लोगों के बारे में बताएं…", "काय दिसते, रस्ता किंवा खूण आणि कोण प्रभावित आहे ते सांगा…")} />
          {!lite && <div className="mt-4 border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><b className="text-sm">{c.voice}</b><p className="mt-1 text-xs text-muted-foreground">{l("The transcript is privacy-redacted before AI triage.", "AI जाँच से पहले लिप्यंतरण से निजी जानकारी हटती है।", "AI तपासणीपूर्वी लिप्यंतरणातून खासगी माहिती काढली जाते.")}</p></div><Button type="button" variant={recording ? "destructive" : "outline"} onClick={toggleRecording} disabled={!consent}>{recording ? <><Square /> {c.stop}</> : <><Mic /> {c.record}</>}</Button></div>
            <label className="mt-4 flex items-start gap-3 text-sm"><Checkbox checked={consent} onCheckedChange={(value) => setConsent(value === true)} /><span>{c.consent}</span></label>
            {audio && <Button type="button" className="mt-4" variant="secondary" onClick={transcribeRecording} disabled={transcribing}>{transcribing ? <Loader2 className="animate-spin" /> : <Mic />} {transcribing ? c.transcribing : c.transcribe}</Button>}
          </div>}
          {!lite && <Button className="mt-5" onClick={() => { if (description.trim().length >= 12) { setError(""); setStep(2); } else setError(l("Please describe the issue in at least 12 characters.", "समस्या कम से कम 12 अक्षरों में बताएं।", "समस्या किमान 12 अक्षरांत सांगा.")); }}>{c.next} <ChevronRight /></Button>}
        </div>}

        {step === 2 && !lite && <div className="mt-6">
          <Label htmlFor="location" className="text-base font-bold">{c.where}</Label>
          <p className="mt-1 text-sm text-muted-foreground">{l("GPS helps find and club reports about the same road or asset. Add a landmark so the reviewer can verify it.", "GPS उसी सड़क या संपत्ति की शिकायतें खोजकर जोड़ने में मदद करता है। समीक्षक के लिए पहचान-चिह्न भी लिखें।", "GPS त्याच रस्त्याच्या किंवा मालमत्तेच्या तक्रारी शोधून जोडण्यास मदत करते. तपासकासाठी खूणही लिहा.")}</p>
          <div className="relative mt-3"><MapPin className="absolute left-3 top-3 size-4 text-civic" /><Input id="location" value={location} onChange={(event) => setLocation(event.target.value)} className="pl-10" placeholder={c.landmark} /></div>
          <Button type="button" variant="outline" className="mt-3" onClick={detectLocation} disabled={locating}>{locating ? <Loader2 className="animate-spin" /> : <LocateFixed />} {locating ? "Detecting…" : c.gps}</Button>
          {latitude !== undefined && longitude !== undefined && <p className="mt-3 text-sm text-civic"><Check className="mr-1 inline size-4" />{c.gpsReady} · {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>}
          <div className="mt-6 flex gap-2"><Button variant="outline" onClick={() => { setError(""); setStep(1); }}>{c.back}</Button><Button onClick={() => { if (location.trim().length >= 3) { setError(""); setStep(3); } else setError(l("Add a landmark or use your current location.", "पहचान-चिह्न लिखें या वर्तमान स्थान लें।", "खूण लिहा किंवा सध्याचे ठिकाण वापरा.")); }}>{c.next} <ChevronRight /></Button></div>
        </div>}

        {step === 3 && !lite && <div className="mt-6 space-y-6">
          <div><Label className="text-base font-bold">{l("Preferred language", "पसंदीदा भाषा", "पसंतीची भाषा")}</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger className="mt-3 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">{l("Detect automatically", "अपने आप पहचानें", "आपोआप ओळखा")}</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="hi">हिन्दी</SelectItem><SelectItem value="mr">मराठी</SelectItem></SelectContent></Select></div>
          <div className="border p-4"><div className="flex items-start gap-3"><FileImage className="mt-0.5 size-5 text-civic" /><div><Label htmlFor="evidence" className="font-bold">{c.attachments}</Label><p className="mt-1 text-xs text-muted-foreground">{c.attachHelp}</p></div></div><Input id="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="mt-4" onChange={(event) => void addEvidence(event.target.files)} />
            {attachments.length > 0 && <div className="mt-4 divide-y border">{attachments.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 p-3 text-sm"><span className="min-w-0 truncate"><Paperclip className="mr-2 inline size-4" />{file.name} <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span></span><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${file.name}`} onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div>)}</div>}
          </div>
          <div className="bg-civic/8 p-4 text-sm leading-6 text-civic"><ShieldCheck className="mr-2 inline size-4" />{c.priority}</div>
          <div className="flex gap-2"><Button variant="outline" onClick={() => { setError(""); setStep(2); }}>{c.back}</Button><Button onClick={() => { setError(""); setStep(4); }}>{c.review} <ChevronRight /></Button></div>
        </div>}

        {step === 4 && !lite && <div className="mt-6"><h2 className="text-2xl font-bold tracking-[-.04em]">{c.review}</h2><div className="mt-5 divide-y border text-sm"><div className="p-4"><span className="text-xs text-muted-foreground">{c.issue}</span><p className="mt-1 leading-6">{description}</p></div><div className="p-4"><span className="text-xs text-muted-foreground">{c.location}</span><p className="mt-1 font-semibold">{location}</p></div><div className="p-4"><span className="text-xs text-muted-foreground">{l("Priority & routing", "प्राथमिकता और विभाग", "प्राधान्य आणि विभाग")}</span><p className="mt-1">{c.priority}</p></div><div className="p-4"><span className="text-xs text-muted-foreground">{l("Evidence", "प्रमाण", "पुरावा")}</span><p className="mt-1">{attachments.length} {l("attachments", "फ़ाइल", "फाइल")}{audio ? l(" + voice recording", " + आवाज़ रिकॉर्डिंग", " + आवाज रेकॉर्डिंग") : ""}</p></div></div><div className="mt-5 flex gap-2"><Button variant="outline" onClick={() => setStep(3)}>{c.back}</Button><Button onClick={submit} disabled={busy}>{busy && <Loader2 className="animate-spin" />}{busy ? l("Saving securely…", "सुरक्षित रूप से सहेज रहे हैं…", "सुरक्षितपणे जतन करत आहोत…") : c.submit}</Button></div></div>}

        {lite && <div className="mt-5 space-y-4"><div><Label htmlFor="lite-location">Nearby location</Label><Input id="lite-location" value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2" placeholder={c.landmark} /></div><p className="border-l-2 border-civic pl-3 text-xs leading-5 text-muted-foreground">{c.priority}</p><Button onClick={submit} disabled={busy} className="w-full">{busy ? "Submitting…" : c.submit}</Button><p className="flex items-start gap-2 text-xs text-muted-foreground"><Save className="size-4 shrink-0" />If the network fails, your text remains on this device. Retrying uses the same protected submission.</p></div>}
        {error && <p role="alert" className="mt-5 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </div>
    </div>
  );
}
