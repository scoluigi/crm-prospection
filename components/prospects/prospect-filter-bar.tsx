"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROSPECT_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { TeamMember } from "@/services/users";

const DUE_OPTIONS = [
  { value: "all", label: "Toutes les relances" },
  { value: "overdue", label: "En retard" },
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Sous 7 jours" },
  { value: "none", label: "Sans relance" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Récemment modifiés" },
  { value: "relance", label: "Relance la plus proche" },
  { value: "entreprise", label: "Nom d'entreprise" },
];

export function ProspectFilterBar({ team }: { team: TeamMember[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      startTransition(() => router.push(`/?${next.toString()}`));
    },
    [router, searchParams],
  );

  const hasFilters = [...searchParams.keys()].length > 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Rechercher une entreprise, un contact, un téléphone…"
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={searchParams.get("status") ?? "all"} onValueChange={(v) => set("status", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="actifs">En cours</SelectItem>
            {PROSPECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("owner") ?? "all"} onValueChange={(v) => set("owner", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les associés</SelectItem>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("due") ?? "all"} onValueChange={(v) => set("due", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Relance" />
          </SelectTrigger>
          <SelectContent>
            {DUE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("sort") ?? "recent"} onValueChange={(v) => set("sort", v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tri" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <X />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}
