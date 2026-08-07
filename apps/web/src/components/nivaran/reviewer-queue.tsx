"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { api, Complaint } from "@/lib/api";
import { QuickReviewDialog } from "./quick-review-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ReviewerQueue({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    try {
      const response = await api<{ data: Complaint[] }>("/reviewer/queue");
      setRows(
        response.data.filter((item) =>
          ["awaiting_review", "reopened"].includes(item.status),
        ),
      );
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Queue unavailable");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    api<{ data: Complaint[] }>("/reviewer/queue")
      .then((response) =>
        setRows(
          response.data.filter((item) =>
            ["awaiting_review", "reopened"].includes(item.status),
          ),
        ),
      )
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Queue unavailable",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const visible = compact ? rows.slice(0, 5) : rows;
  if (loading)
    return (
      <div className="grid min-h-40 place-items-center border bg-card">
        <Loader2 className="animate-spin text-civic" />
      </div>
    );
  if (error)
    return (
      <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-900">
        {error}
      </div>
    );
  if (!visible.length)
    return (
      <div className="border bg-card p-8 text-center">
        <h3 className="font-bold">Nothing awaiting review</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          New AI recommendations will appear here.
        </p>
      </div>
    );
  return (
    <div className="divide-y border bg-card">
      {visible.map((complaint) => (
        <article
          key={complaint.id}
          className="grid gap-4 p-4 transition-colors hover:bg-civic/5 md:grid-cols-[1fr_auto] md:items-center"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-civic">
                {complaint.reference_number}
              </span>
              <Badge
                variant={
                  complaint.priority === "critical" ? "destructive" : "outline"
                }
                className="capitalize"
              >
                {complaint.priority}
              </Badge>
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-bold">
              {complaint.normalized_text || complaint.safe_text}
            </h3>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {complaint.location_text}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickReviewDialog complaint={complaint} onComplete={load} />
            <Button asChild size="sm" variant="ghost">
              <Link href={`/reviewer/complaints/${complaint.id}`}>
                Open details
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
