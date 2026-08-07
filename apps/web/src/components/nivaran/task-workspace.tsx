"use client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Paperclip, Route } from "lucide-react";
import { toast } from "sonner";
import { API_URL, api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
type TaskDetail = {
  data: {
    assignment: { status: string; kind: string };
    complaint: Complaint;
    dependencies: { id: string }[];
    sla?: { resolution_due_at: string };
  };
};
export function TaskWorkspace({ id }: { id: string }) {
  const [detail, setDetail] = useState<TaskDetail["data"] | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    api<TaskDetail>(`/department/tasks/${id}`)
      .then((response) => setDetail(response.data))
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "Task unavailable"),
      )
      .finally(() => setLoading(false));
  }, [id]);
  async function update(next: string) {
    if (!detail) return;
    try {
      await api(`/department/tasks/${id}/status`, {
        method: "POST",
        body: JSON.stringify({
          status: next,
          note,
          expected_version: detail.complaint.version,
        }),
      });
      setDetail((current) =>
        current
          ? {
              ...current,
              assignment: { ...current.assignment, status: next },
              complaint: {
                ...current.complaint,
                version: current.complaint.version + 1,
                status: next === "resolved" ? "resolved" : next,
              },
            }
          : current,
      );
      toast.success(`Task marked ${next.replaceAll("_", " ")}`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Update failed");
    }
  }
  async function upload(file?: File) {
    if (!file || !detail) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(
        `${API_URL}/complaints/${detail.complaint.id}/evidence`,
        { method: "POST", credentials: "include", body },
      );
      if (!response.ok) throw new Error("Evidence upload failed");
      toast.success("Protected evidence attached");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Evidence upload failed",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  if (loading)
    return (
      <div className="grid min-h-72 place-items-center border bg-card">
        <Loader2 className="animate-spin text-civic" />
      </div>
    );
  if (!detail)
    return (
      <p className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">
        {error}
      </p>
    );
  const { complaint, assignment, dependencies, sla } = detail;
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            {complaint.reference_number} · {assignment.kind} task
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">
            {complaint.title ||
              complaint.normalized_text ||
              "Civic service task"}
          </h2>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {complaint.location_text}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              variant={
                complaint.priority === "critical" ? "destructive" : "secondary"
              }
              className="capitalize"
            >
              {complaint.priority} priority
            </Badge>
            {sla ? (
              <Badge variant="outline">
                Resolve by {new Date(sla.resolution_due_at).toLocaleString()}
              </Badge>
            ) : null}
          </div>
        </div>
        <Badge className="capitalize">
          {assignment.status.replaceAll("_", " ")}
        </Badge>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_.72fr]">
        <section className="border bg-card p-6">
          <h3 className="font-bold">Verified complaint context</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {complaint.normalized_text || complaint.safe_text}
          </p>
          <div className="mt-5 border p-4">
            <Route className="size-4 text-civic" />
            <span className="mt-3 block text-xs text-muted-foreground">
              Cross-department dependencies
            </span>
            <b className="mt-1 block text-sm">
              {dependencies.length
                ? `${dependencies.length} linked task${dependencies.length === 1 ? "" : "s"}`
                : "No dependency"}
            </b>
          </div>
          <div className="mt-6">
            <Label htmlFor="note">Operational note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2"
              placeholder="Record only service-relevant details…"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => update("acknowledged")}
              disabled={assignment.status !== "assigned"}
            >
              Acknowledge
            </Button>
            <Button
              variant="outline"
              onClick={() => update("in_progress")}
              disabled={assignment.status !== "acknowledged"}
            >
              Start work
            </Button>
            <Button
              variant="outline"
              onClick={() => update("resolved")}
              disabled={assignment.status !== "in_progress"}
            >
              <CheckCircle2 />
              Mark resolved
            </Button>
          </div>
        </section>
        <aside className="border bg-card p-6">
          <p className="eyebrow">Operational evidence</p>
          <div className="mt-5 border border-dashed p-8 text-center">
            <Paperclip className="mx-auto size-5 text-civic" />
            <b className="mt-3 block text-sm">Attach site evidence</b>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              JPG, PNG, WebP, MP4, or WebM · protected access
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              className="sr-only"
              onChange={(event) => void upload(event.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? "Uploading…" : "Select file"}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Reporter contact details are not exposed in department tasks.
          </p>
        </aside>
      </div>
    </div>
  );
}
