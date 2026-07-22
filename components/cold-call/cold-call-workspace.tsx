"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneCall, PhoneOff, SkipForward } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/badges";
import { LogCallForm } from "@/components/calls/log-call-form";
import { cn, normalize } from "@/lib/utils";
import type { ProspectWithOwner } from "@/services/prospects";

export function ColdCallWorkspace({
  queue,
  currentUserId,
}: {
  queue: ProspectWithOwner[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = queue;
    if (scope === "mine") list = list.filter((p) => p.ownerId === currentUserId);
    if (search.trim()) {
      const term = normalize(search);
      list = list.filter(
        (p) =>
          normalize(p.companyName).includes(term) ||
          normalize(p.contactName ?? "").includes(term) ||
          (p.phone ?? "").includes(search.trim()),
      );
    }
    return list;
  }, [queue, scope, search, currentUserId]);

  useEffect(() => {
    if (selectedId && !filtered.some((p) => p.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    } else if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const current = filtered.find((p) => p.id === selectedId) ?? null;

  function selectNext(afterId: string) {
    const idx = filtered.findIndex((p) => p.id === afterId);
    const next = filtered[idx + 1] ?? filtered[idx - 1] ?? null;
    setSelectedId(next?.id ?? null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* File d'attente */}
      <Card className="flex flex-col lg:col-span-2">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between">
            <CardTitle>File d&apos;appels ({filtered.length})</CardTitle>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setScope("mine")}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                scope === "mine" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              Mes prospects
            </button>
            <button
              onClick={() => setScope("all")}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                scope === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              Toute l&apos;équipe
            </button>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer la file…"
          />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState icon={PhoneOff} title="Aucun prospect à appeler" description="Belle performance : la file est vide !" className="py-8" />
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                    p.id === selectedId
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-transparent hover:bg-slate-50",
                  )}
                >
                  <UserAvatar name={p.ownerName ?? "?"} color={p.ownerColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{p.companyName}</p>
                    <p className="truncate text-xs text-slate-500">{p.phone ?? "Pas de téléphone"}</p>
                  </div>
                  <StatusBadge status={p.status} className="shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fiche d'appel */}
      <Card className="lg:col-span-3">
        {!current ? (
          <CardContent className="py-12">
            <EmptyState icon={PhoneCall} title="Sélectionne un prospect à gauche" description="Ou change de filtre si la file est vide." />
          </CardContent>
        ) : (
          <>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base">{current.companyName}</CardTitle>
                <p className="mt-0.5 text-sm text-slate-500">
                  {current.contactName ?? "Contact inconnu"}
                  {current.sector ? ` · ${current.sector}` : ""}
                  {current.city ? ` · ${current.city}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => current && selectNext(current.id)}>
                <SkipForward />
                Passer
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {current.phone ? (
                <a
                  href={`tel:${current.phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  <Phone className="size-4" />
                  Appeler {current.phone}
                </a>
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
                  Aucun numéro renseigné pour ce prospect.
                </p>
              )}

              {current.notes && (
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <p className="mb-0.5 font-medium text-slate-500">À savoir avant d&apos;appeler</p>
                  {current.notes}
                </div>
              )}

              <LogCallForm
                key={current.id}
                prospectId={current.id}
                onLogged={() => {
                  const id = current.id;
                  router.refresh();
                  selectNext(id);
                }}
              />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
