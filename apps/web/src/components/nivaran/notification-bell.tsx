"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type NotificationItem = { id: string; message: string; kind: string; read: boolean; created_at: string };

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  async function markRead(id: string) {
    try {
      await api(`/notifications/${id}/read`, { method: "POST" });
      setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    } catch { /* A notification should remain visible if marking it read fails. */ }
  }
  useEffect(() => {
    api<{ data: NotificationItem[] }>("/notifications")
      .then((response) => setItems(response.data.slice(0, 12)))
      .finally(() => setLoading(false));
  }, []);
  const unread = items.filter((item) => !item.read).length;
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative" aria-label="Open notifications"><Bell />{unread ? <Badge className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full p-0 text-[10px]">{unread}</Badge> : null}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0"><div className="border-b px-4 py-3"><b className="text-sm">Notifications</b></div>{loading ? <div className="grid h-24 place-items-center"><Loader2 className="animate-spin" /></div> : !items.length ? <p className="p-5 text-sm text-muted-foreground">No new notifications.</p> : <div className="max-h-96 overflow-y-auto">{items.map((item) => <button key={item.id} type="button" onClick={() => void markRead(item.id)} className={`w-full border-b px-4 py-3 text-left text-sm hover:bg-secondary/60 ${item.read ? "text-muted-foreground" : "bg-civic/5"}`}><span className="block font-semibold capitalize">{item.kind.replaceAll("_", " ")}</span><span className="mt-1 block leading-5">{item.message}</span><time className="mt-2 block text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</time></button>)}</div>}</DropdownMenuContent></DropdownMenu>;
}
