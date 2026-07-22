"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, PhoneCall, Plus, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { NAV_ITEMS } from "./nav-items";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewProspectDialog } from "@/components/prospects/new-prospect-dialog";
import type { TeamMember } from "@/services/users";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type NavCounts = { todo: number; relances: number; coldcall: number };

export function AppShell({
  user,
  team,
  counts,
  children,
}: {
  user: TeamMember;
  team: TeamMember[];
  counts: NavCounts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const count = item.badge ? counts[item.badge] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <item.icon className={cn("size-4 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
            <span className="flex-1 truncate">{item.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold",
                  item.badge === "relances" && counts.relances > 0
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-200 text-slate-700",
                )}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200 px-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <PhoneCall className="size-4" />
      </span>
      <span className="text-sm font-semibold text-slate-900">CRM Prospection</span>
    </div>
  );

  const footer = (
    <div className="shrink-0 border-t border-slate-200 p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-100">
            <UserAvatar name={user.name} color={user.color} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800">{user.name}</span>
              <span className="block truncate text-[11px] text-slate-500">
                {ROLE_LABELS[user.role]}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/parametres">Paramètres</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => void logoutAction()}>
            <LogOut />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Barre latérale — desktop */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Barre latérale — mobile */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pr-2">
              <div className="flex-1">{brand}</div>
              <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)}>
                <X />
              </Button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-56">
        {/* Barre supérieure */}
        <header className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu />
          </Button>

          <div className="flex-1" />

          <NewProspectDialog team={team} currentUserId={user.id}>
            <Button size="sm">
              <Plus />
              <span className="hidden sm:inline">Nouveau prospect</span>
              <span className="sm:hidden">Prospect</span>
            </Button>
          </NewProspectDialog>
        </header>

        <main className="flex-1 p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
