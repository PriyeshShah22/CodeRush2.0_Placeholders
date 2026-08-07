"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  LocateFixed,
  Mic,
  Send,
  Square,
  UserRound,
} from "lucide-react";
import { api, API_URL, Complaint } from "@/lib/api";
import { useLanguage } from "./language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { from: "resident" | "assistant"; text: string };
const intro = {
  en: "Tell me what happened. I’ll ask only what is needed, show you a summary, and file it after you confirm.",
  hi: "बताइए क्या हुआ। मैं केवल ज़रूरी सवाल पूछूँगा, सारांश दिखाऊँगा और आपकी पुष्टि के बाद शिकायत दर्ज करूँगा।",
  mr: "काय घडले ते सांगा. मी फक्त आवश्यक प्रश्न विचारेन, सारांश दाखवेन आणि तुमच्या पुष्टीनंतर तक्रार नोंदवेन.",
};

export function ComplaintAssistant({
  onFiled,
}: {
  onFiled?: (complaint: Complaint) => void;
}) {
  const { locale, tr } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { from: "assistant", text: intro[locale] },
  ]);
  const [session, setSession] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [location, setLocation] = useState<{
    location_text: string;
    latitude: number;
    longitude: number;
  }>();
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const messagePane = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const pane = messagePane.current;
    if (pane) pane.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    setMessages((current) => [...current, { from: "resident", text: clean }]);
    setBusy(true);
    try {
      const response = await api<{
        data: {
          session_id: string;
          reply: string;
          state: string;
          complaint?: Complaint;
        };
      }>("/assistant/messages", {
        method: "POST",
        body: JSON.stringify({
          session_id: session,
          message: clean,
          language: locale,
          ...location,
        }),
      });
      setSession(response.data.session_id);
      setMessages((current) => [
        ...current,
        { from: "assistant", text: response.data.reply },
      ]);
      if (response.data.complaint) onFiled?.(response.data.complaint);
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: "assistant",
          text: tr("Please try again."),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function shareLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await api<{
          data: { display_name: string; latitude: number; longitude: number };
        }>(
          `/locations/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}`,
        );
        setLocation({
          location_text: response.data.display_name,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setMessages((current) => [
          ...current,
          {
            from: "resident",
            text: tr("Shared location: {location}", { location: response.data.display_name }),
          },
        ]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            from: "assistant",
            text: tr("I could not verify that location. Please type a street or landmark."),
          },
        ]);
      }
    });
  }

  async function toggleVoice() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const next = new MediaRecorder(stream);
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      next.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setBusy(true);
        const form = new FormData();
        form.append(
          "file",
          new Blob(chunks.current, { type: next.mimeType || "audio/webm" }),
          "complaint.webm",
        );
        try {
          const response = await fetch(`${API_URL}/voice/transcribe-preview`, {
            method: "POST",
            credentials: "include",
            headers: { "X-Voice-Consent": "true" },
            body: form,
          });
          const payload = await response.json();
          if (!response.ok)
            throw new Error(tr("Voice translation failed"));
          setBusy(false);
          await send(payload.data.safe_text);
        } catch {
          setMessages((current) => [
            ...current,
            {
              from: "assistant",
              text: tr("Voice translation failed"),
            },
          ]);
        } finally {
          setBusy(false);
        }
      };
      next.start();
      recorder.current = next;
      setRecording(true);
    } catch {
      setMessages((current) => [
        ...current,
        {
          from: "assistant",
          text: tr("Allow microphone access, or type your complaint below."),
        },
      ]);
    }
  }

  return (
    <section className="motion-pop flex h-[min(720px,calc(100vh-10rem))] min-h-[560px] flex-col overflow-hidden border bg-card shadow-sm">
      <header className="flex shrink-0 items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <span className="ambient-dot grid size-10 place-items-center rounded-full bg-civic text-white">
            <Bot className="size-5" />
          </span>
          <div>
            <h2 className="font-bold">{tr("Nivaran filing assistant")}</h2>
            <p className="text-xs text-muted-foreground">
              {tr("Only files complaints · remembers this conversation")}
            </p>
          </div>
        </div>
        {location && (
          <span className="flex items-center gap-1 text-xs text-civic">
            <CheckCircle2 className="size-4" />
            {tr("Location shared")}
          </span>
        )}
      </header>
      <div
        ref={messagePane}
        className="chat-scroll flex-1 space-y-4 overflow-y-auto scroll-smooth p-4 sm:p-6"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`motion-rise flex gap-2 ${message.from === "resident" ? "justify-end" : "justify-start"}`}
          >
            {message.from === "assistant" && (
              <Bot className="mt-2 size-4 shrink-0 text-civic" />
            )}
            <p
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.from === "resident" ? "bg-ink text-white" : "bg-secondary"}`}
            >
              {message.text}
            </p>
            {message.from === "resident" && (
              <UserRound className="mt-2 size-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
        {busy && (
          <p className="motion-fade text-xs text-muted-foreground">{tr("Thinking…")}</p>
        )}
      </div>
      <form
        className="shrink-0 border-t bg-card p-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const input = new FormData(form).get("message")?.toString() || "";
          form.reset();
          void send(input);
        }}
      >
        <div className="flex gap-2">
          <Input
            className="h-10"
            name="message"
            autoComplete="off"
            placeholder={tr("Describe the issue or answer the question…")}
            aria-label={tr("Message the complaint assistant")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10"
            onClick={shareLocation}
            aria-label={tr("Share current location")}
          >
            <LocateFixed />
          </Button>
          <Button
            type="button"
            variant={recording ? "destructive" : "outline"}
            size="icon"
            className="size-10"
            onClick={toggleVoice}
            aria-label={recording ? tr("Stop recording") : tr("Speak complaint")}
          >
            {recording ? <Square /> : <Mic />}
          </Button>
          <Button
            size="icon"
            className="size-10"
            disabled={busy}
            aria-label={tr("Send")}
          >
            <Send />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {tr("Voice is translated by Sarvam. The assistant files only after you confirm the summary.")}
        </p>
      </form>
    </section>
  );
}
