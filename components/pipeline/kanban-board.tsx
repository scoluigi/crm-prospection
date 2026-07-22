"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { GripVertical, Phone } from "lucide-react";
import { changeStatusAction } from "@/app/actions/prospects";
import { UserAvatar } from "@/components/ui/avatar";
import { DueBadge } from "@/components/shared/badges";
import {
  PIPELINE_COLUMNS,
  STATUS_DOTS,
  STATUS_LABELS,
  type ProspectStatus,
} from "@/lib/constants";
import { cn, formatEuro, urgencyOf } from "@/lib/utils";
import type { ProspectWithOwner } from "@/services/prospects";

export function KanbanBoard({ prospects }: { prospects: ProspectWithOwner[] }) {
  // État local optimiste : évite d'attendre le round-trip serveur pour voir la carte bouger.
  const [items, setItems] = useState(prospects);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ProspectStatus | null>(null);
  const [, startTransition] = useTransition();

  const byColumn = useMemo(() => {
    const map = new Map<ProspectStatus, ProspectWithOwner[]>();
    for (const status of PIPELINE_COLUMNS) map.set(status, []);
    for (const p of items) {
      if (map.has(p.status)) map.get(p.status)!.push(p);
    }
    return map;
  }, [items]);

  const columnTotal = (status: ProspectStatus) =>
    (byColumn.get(status) ?? []).reduce((sum, p) => sum + (p.estimatedAmount ?? 0), 0);

  function drop(status: ProspectStatus) {
    if (!dragId) return;
    const prospect = items.find((p) => p.id === dragId);
    setOverColumn(null);
    if (!prospect || prospect.status === status) {
      setDragId(null);
      return;
    }

    const previousStatus = prospect.status;
    setItems((prev) => prev.map((p) => (p.id === dragId ? { ...p, status } : p)));
    setDragId(null);

    startTransition(async () => {
      const res = await changeStatusAction(prospect.id, status);
      if (res.error) {
        setItems((prev) => prev.map((p) => (p.id === prospect.id ? { ...p, status: previousStatus } : p)));
        toast.error(res.error);
      } else {
        toast.success(`${prospect.companyName} → ${STATUS_LABELS[status]}`);
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
      {PIPELINE_COLUMNS.map((status) => {
        const columnItems = byColumn.get(status) ?? [];
        const total = columnTotal(status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(status);
            }}
            onDragLeave={() => setOverColumn((c) => (c === status ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              drop(status);
            }}
            className={cn(
              "flex w-[270px] shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50/60 transition-colors",
              overColumn === status && "kanban-drop-target",
            )}
          >
            <div className="flex items-center gap-2 border-b border-slate-200/80 px-3 py-2.5">
              <span className={cn("size-2 rounded-full", STATUS_DOTS[status])} />
              <h3 className="flex-1 text-sm font-semibold text-slate-700">{STATUS_LABELS[status]}</h3>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
                {columnItems.length}
              </span>
            </div>
            {total > 0 && (
              <p className="border-b border-slate-200/80 px-3 py-1 text-[11px] font-medium text-slate-400">
                {formatEuro(total)}
              </p>
            )}

            <div className="flex min-h-[80px] flex-col gap-2 p-2">
              {columnItems.map((p) => (
                <KanbanCard
                  key={p.id}
                  prospect={p}
                  dragging={dragId === p.id}
                  onDragStart={() => setDragId(p.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverColumn(null);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  prospect,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  prospect: ProspectWithOwner;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const urgency = urgencyOf(prospect.nextFollowUp);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md",
        dragging && "kanban-dragging",
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <Link href={`/prospects/${prospect.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 hover:text-indigo-600">
          {prospect.companyName}
        </Link>
        <GripVertical className="size-3.5 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100" />
      </div>

      <p className="truncate text-xs text-slate-500">{prospect.contactName ?? prospect.phone ?? "—"}</p>

      <div className="flex items-center justify-between gap-1.5">
        {prospect.ownerName && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <UserAvatar name={prospect.ownerName} color={prospect.ownerColor} size="sm" className="size-4 text-[8px]" />
            {prospect.ownerName}
          </span>
        )}
        {prospect.estimatedAmount ? (
          <span className="text-[11px] font-medium text-slate-500">{formatEuro(prospect.estimatedAmount)}</span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <DueBadge date={prospect.nextFollowUp} className="text-[10px]" />
        {prospect.phone && (
          <a
            href={`tel:${prospect.phone}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex size-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600",
              urgency === "overdue" && "text-rose-500",
            )}
            aria-label="Appeler"
          >
            <Phone className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
