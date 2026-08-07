"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "./language-provider";
export function CorrectionButton({ complaintId }: { complaintId: string }) {
  const { tr } = useLanguage(); const [message, setMessage] = useState(""); const [open, setOpen] = useState(false);
  async function submit() { try { await api(`/complaints/${complaintId}/appeals`, { method: "POST", body: JSON.stringify({ kind: "correction", message }) }); toast.success(tr("Human review request recorded")); setOpen(false); } catch { toast.error(tr("Could not submit request")); } }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="link" className="mt-1 h-auto p-0">{tr("Request a correction")}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{tr("What should we review?")}</DialogTitle><DialogDescription>{tr("This will reopen the complaint for human review. It will not delete the original report.")}</DialogDescription></DialogHeader><div><Label htmlFor="correction">{tr("Correction or concern")}</Label><Textarea id="correction" value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2" placeholder={tr("Describe what appears incorrect…")} /></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{tr("Cancel")}</Button><Button onClick={() => void submit()} disabled={message.trim().length < 12}>{tr("Request review")}</Button></DialogFooter></DialogContent></Dialog>;
}
