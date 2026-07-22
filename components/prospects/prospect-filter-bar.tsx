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
import {
  INTEREST_LABELS,
  INTEREST_LEVELS,
  PROSPECT_STATUSES,
  STATUS_LABELS,
} from "@/lib/constants";
import type { TeamMember } from "@/services/users";

const DUE_OPTIONS = [
  { value: "all", label: "Toutes les relances" },
  { value: "overdue", label: "Relances en retard" },
  { value: "today", label: "Relance aujourd'hui" },
  { value: "week", label: "Relance sous 7 jours" },
  { value: "none", label: "Sans relance planifiée" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Récemment modifiés" },
  { value: "relance", label: "Relance la plus proche" },
  { value: "montant", label: "Montant estimé" },
  { value: "entreprise", label: "Nom d'entreprise" },
];

export function ProspectFilterBar({
  team,
  cities,
  sectors,
}: {
  team: TeamMember[];
  cities: string[];
  sectors: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      startTransition(() => router.push(`/prospects?${next.toString()}`));
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
          placeholder="Rechercher une entreprise, un contact, un téléphone, un email…"
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={searchParams.get("status") ?? "all"} onValueChange={(v) => set("status", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="actifs">Pipeline actif</SelectItem>
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

        <Select value={searchParams.get("interest") ?? "all"} onValueChange={(v) => set("interest", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Intérêt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout intérêt</SelectItem>
            {INTEREST_LEVELS.map((i) => (
              <SelectItem key={i} value={i}>
                {INTEREST_LABELS[i]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("due") ?? "all"} onValueChange={(v) => set("due", v)}>
          <SelectTrigger className="w-[190px]">
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

        {cities.length > 0 && (
          <Select value={searchParams.get("city") ?? "all"} onValueChange={(v) => set("city", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {sectors.length > 0 && (
          <Select value={searchParams.get("sector") ?? "all"} onValueChange={(v) => set("sector", v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Secteur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les secteurs</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={searchParams.get("sort") ?? "recent"} onValueChange={(v) => set("sort", v)}>
          <SelectTrigger className="w-[190px]">
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/prospects")}>
            <X />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}
