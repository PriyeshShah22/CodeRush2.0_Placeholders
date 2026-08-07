"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Loader2, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { api, Complaint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "./language-provider";

type Department = { id: string; name: string };
type Detail = {
  complaint: Complaint;
  routes: { department_id: string; department: string }[];
  sla?: { resolution_due_at: string };
};
const categories = [
  "roads",
  "water",
  "drainage",
  "sanitation",
  "streetlight",
  "electrical_hazard",
  "trees",
  "flooding",
  "accessibility",
  "public_infrastructure",
  "public_safety",
  "other",
];

function remainingHours(value?: string) {
  if (!value) return 72;
  return Math.max(
    1,
    Math.min(
      720,
      Math.round((new Date(value).getTime() - Date.now()) / 3_600_000),
    ),
  );
}

export function QuickReviewDialog({
  complaint,
  onComplete,
  triggerLabel = "Quick approve",
}: {
  complaint: Complaint;
  onComplete?: () => void;
  triggerLabel?: string;
}) {
  const { locale, tr, priority: priorityLabel, category: categoryLabel, department: departmentLabel, location } = useLanguage();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Detail>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [priority, setPriority] = useState(complaint.priority);
  const [category, setCategory] = useState(complaint.category || "other");
  const [resolutionHours, setResolutionHours] = useState(72);
  const [department, setDepartment] = useState("");
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    Promise.all([
      api<{ data: Detail }>(`/complaints/${complaint.id}`),
      api<{ data: Department[] }>("/reviewer/departments"),
    ])
      .then(([a, b]) => {
        setDetail(a.data);
        setDepartments(b.data);
        setPriority(a.data.complaint.priority);
        setCategory(a.data.complaint.category || "other");
        setResolutionHours(remainingHours(a.data.sla?.resolution_due_at));
        setDepartment(a.data.routes[0]?.department_id || "");
      })
      .catch(() => setError(tr("Review unavailable")))
      .finally(() => setBusy(false));
  }, [open, complaint.id, tr]);
  const recommended = detail?.routes[0]?.department_id;
  async function approve() {
    if (!detail || !department) return;
    setBusy(true);
    setError("");
    try {
      const decision = await api<{ data: Complaint }>(
        `/reviewer/complaints/${complaint.id}/decision`,
        {
          method: "POST",
          body: JSON.stringify({
            category,
            priority,
            resolution_hours: resolutionHours,
            reason_code: "reviewer_adjustment",
            expected_version: detail.complaint.version,
          }),
        },
      );
      await api(`/reviewer/complaints/${complaint.id}/assign`, {
        method: "POST",
        body: JSON.stringify({
          primary_department_id: department,
          supporting_department_ids: [],
          reason_code:
            department !== recommended ? "reviewer_routing_change" : null,
          expected_version: decision.data.version,
        }),
      });
      toast.success(tr("Approved and assigned"));
      setOpen(false);
      onComplete?.();
    } catch (reason) {
      setError(reason instanceof Error ? tr("Approval failed") : tr("Approval failed"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(next)=>{setOpen(next);if(next){setBusy(true);setError("")}}}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Check />
          {tr(triggerLabel)}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Review and approve complaint")}</DialogTitle>
          <DialogDescription>
            {tr("Confirm the AI recommendation or adjust category, priority, department, and resolution time.")}
          </DialogDescription>
        </DialogHeader>
        {busy && !detail ? (
          <div className="grid min-h-40 place-items-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          detail && (
            <div className="space-y-5">
              <div className="border bg-secondary/35 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-civic">
                    {detail.complaint.reference_number}
                  </span>
                  <Badge className="capitalize">
                    {priorityLabel(detail.complaint.priority)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7">
                  {detail.complaint.original_text}
                </p>
                {detail.complaint.normalized_text &&
                detail.complaint.normalized_text !==
                  detail.complaint.original_text ? (
                  <div className="mt-4 border-t pt-4">
                    <span className="text-xs font-bold text-muted-foreground">
                      {tr(locale === "hi" ? "Hindi translation" : locale === "mr" ? "Marathi translation" : "English translation")}
                    </span>
                    <p className="mt-1 text-sm leading-6">
                      {locale === "hi" ? detail.complaint.translation_hi || detail.complaint.normalized_text : locale === "mr" ? detail.complaint.translation_mr || detail.complaint.normalized_text : detail.complaint.normalized_text}
                    </p>
                  </div>
                ) : null}
                <p className="mt-4 flex items-start gap-2 text-sm font-semibold">
                  <MapPin className="mt-0.5 size-4 text-civic" />
                  {location(detail.complaint.location_text)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverride((value) => !value)}
                className="flex items-center gap-2 text-sm font-bold text-civic"
              >
                <Pencil className="size-4" />
                {override ? tr("Use compact review") : tr("Adjust recommendation")}
              </button>
              {override ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{tr("Category")}</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((value) => (
                          <SelectItem key={value} value={value}>
                            {categoryLabel(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{tr("Priority")}</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["low", "normal", "high", "critical"].map((value) => (
                          <SelectItem key={value} value={value}>
                            {priorityLabel(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resolution-hours">
                      {tr("Resolution time (hours)")}
                    </Label>
                    <div className="relative mt-2">
                      <Clock3 className="absolute left-3 top-2.5 size-4 text-civic" />
                      <Input
                        id="resolution-hours"
                        className="pl-9"
                        type="number"
                        min={1}
                        max={720}
                        value={resolutionHours}
                        onChange={(event) =>
                          setResolutionHours(
                            Math.max(
                              1,
                              Math.min(720, Number(event.target.value) || 1),
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{tr("Department")}</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue placeholder={tr("Select department")} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {departmentLabel(item.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-3">
                <span>
                  <b>{tr("Department")}</b>
                  <small className="mt-1 block">
                    {departmentLabel(departments.find((item) => item.id === department)?.name || detail.routes[0]?.department || tr("Choose one"))}
                  </small>
                </span>
                <span>
                  <b>{tr("Priority")}</b>
                  <small className="mt-1 block">{priorityLabel(priority)}</small>
                </span>
                <span>
                  <b>{tr("Resolution target")}</b>
                  <small className="mt-1 block">{tr("{hours} hours", { hours: resolutionHours })}</small>
                </span>
              </div>
            </div>
          )
        )}
        {error ? (
          <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tr("Cancel")}
          </Button>
          <Button onClick={approve} disabled={busy || !department}>
            {busy ? <Loader2 className="animate-spin" /> : null}{tr("Approve and assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
