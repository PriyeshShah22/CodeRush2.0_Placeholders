"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { Brand, LanguagePicker } from "./brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useLanguage } from "./language-provider";

const nav = {
  resident: [
    { href: "/resident", label: "Resident workspace", icon: LayoutDashboard },
  ],
  reviewer: [
    { href: "/reviewer", label: "Review complaints", icon: LayoutDashboard },
  ],
  department: [
    { href: "/department", label: "Work overview", icon: LayoutDashboard },
    { href: "/department/tasks", label: "Assigned tasks", icon: Workflow },
  ],
  admin: [
    { href: "/admin", label: "Operations overview", icon: LayoutDashboard },
    { href: "/admin/escalations", label: "SLA escalations", icon: Workflow },
    { href: "/admin/departments", label: "Departments", icon: Users },
    { href: "/admin/audit", label: "Audit trail", icon: ShieldCheck },
  ],
};
function Nav({ role }: { role: keyof typeof nav }) {
  const pathname = usePathname();
  const { tr } = useLanguage();
  return (
    <nav className="mt-8 space-y-1" aria-label={tr("Navigation")}>
      {nav[role].map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold ${pathname === href || pathname.startsWith(href + "/") ? "bg-civic text-white" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
        >
          <Icon className="size-4" />
          {tr(label)}
        </Link>
      ))}
    </nav>
  );
}
export function PortalShell({
  role,
  title,
  children,
}: {
  role: keyof typeof nav;
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t, tr, roleLabel } = useLanguage();
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink p-5 text-white lg:block">
        <Brand />
        <p className="mt-6 border-y border-white/10 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-300">
          {tr("{role} workspace", { role: roleLabel(role) })}
        </p>
        <Nav role={role} />
        <button
          onClick={logout}
          className="absolute bottom-6 left-5 flex items-center gap-3 text-sm font-semibold text-white/60 hover:text-white"
        >
          <LogOut className="size-4" /> {t("signOut")}
        </button>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-0 bg-ink p-5 text-white"
              >
                <SheetTitle className="sr-only">{tr("Navigation")}</SheetTitle>
                <Brand />
                <Nav role={role} />
                <Button
                  variant="ghost"
                  className="mt-8 w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={logout}
                >
                  <LogOut /> {t("signOut")}
                </Button>
              </SheetContent>
            </Sheet>
            <div>
              <span className="eyebrow hidden sm:block">
                {tr("Synthetic Samanvay Nagar")}
              </span>
              <h1 className="font-bold tracking-[-.03em]">{tr(title)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {t("notifications")}
            </span>
            <LanguagePicker />
          </div>
        </header>
        <main className="p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
