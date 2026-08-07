"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

function remaining(dueAt: string, now: number) {
  const seconds = Math.max(0, Math.ceil((new Date(dueAt).getTime() - now) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { expired: seconds === 0, label: `${hours}h ${String(minutes).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s` };
}

export function RecoveryCountdown({ dueAt, compact = false }: { dueAt: string; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const time = remaining(dueAt, now);
  if (compact) return <span className={time.expired ? "font-mono text-xs font-bold text-red-700" : "font-mono text-xs font-bold text-amber-900"}>{time.expired ? "Recovery target overdue" : `${time.label} left`}</span>;
  return <div className={time.expired ? "border border-red-300 bg-red-50 p-4 text-red-950" : "border border-amber-300 bg-amber-50 p-4 text-amber-950"}><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><Timer className="size-4" />Admin recovery target</div><p className="mt-2 text-sm">This complaint is urgent. {time.expired ? "The recovery target has been exceeded." : "Complete the work before the countdown ends."}</p><p className="mt-2 font-mono text-2xl font-bold tracking-tight">{time.expired ? "Overdue" : `${time.label} left`}</p></div>;
}
