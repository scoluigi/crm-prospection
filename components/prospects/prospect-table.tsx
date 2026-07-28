"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/badges";
import { cn, relativeDayLabel, today, urgencyOf } from "@/lib/utils";
import type { ProspectWithOwner } from "@/services/prospects";
import type { TeamMember } from "@/services/users";

/** Les 3 dates de relance : la prochaine à venir est mise en avant, les passées grisées. */
function Relances({ p }: { p: ProspectWithOwner }) {
  const dates = [p.relance1, p.relance2, p.relance3].filter((d): d is string => Boolean(d));
  if (dates.length === 0) return <span className="text-xs text-slate-400">—</span>;
  const day = today();
  return (
    <div className="flex flex-wrap gap-1">
      {dates.sort().map((d, i) => {
        const u = urgencyOf(d);
        const isNext = d === p.nextFollowUp;
        return (
          <span
            key={i}
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
              isNext && u === "overdue" && "border-rose-200 bg-rose-50 text-rose-700",
              isNext && u === "today" && "border-amber-200 bg-amber-50 text-amber-800",
              isNext && (u === "soon" || u === "later") && "border-indigo-200 bg-indigo-50 text-indigo-700",
              !isNext && "border-slate-200 bg-slate-50 text-slate-400",
            )}
          >
            R{i + 1}&nbsp;· {d < day && !isNext ? "fait" : relativeDayLabel(d)}
          </span>
        );
      })}
    </div>
  );
}

export function ProspectTable({ prospects }: { prospects: ProspectWithOwner[]; team?: TeamMember[] }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-2.5">Entreprise</th>
              <th className="px-4 py-2.5">Téléphone</th>
              <th className="px-4 py-2.5">Source</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5">Responsable</th>
              <th className="px-4 py-2.5">Relances</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prospects.map((p) => (
              <tr key={p.id} className="group transition-colors hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link href={`/prospects/${p.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                    {p.companyName}
                  </Link>
                  {p.contactName && <p className="text-xs text-slate-400">{p.contactName}</p>}
                </td>
                <td className="px-4 py-2.5">
                  {p.phone ? (
                    <a
                      href={`tel:${p.phone}`}
                      className="flex items-center gap-1 text-slate-600 hover:text-indigo-600"
                    >
                      <Phone className="size-3 text-slate-400" />
                      {p.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{p.source ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-2.5">
                  {p.ownerName && (
                    <div className="flex items-center gap-1.5">
                      <UserAvatar name={p.ownerName} color={p.ownerColor} size="sm" />
                      <span className="text-xs text-slate-600">{p.ownerName}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Relances p={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        {prospects.map((p) => (
          <Link
            key={p.id}
            href={`/prospects/${p.id}`}
            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm active:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{p.companyName}</p>
                <p className="truncate text-xs text-slate-500">
                  {p.contactName ?? p.phone ?? "Aucun contact"}
                </p>
              </div>
              {p.ownerName && <UserAvatar name={p.ownerName} color={p.ownerColor} size="sm" />}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={p.status} />
              {p.source && <span className="text-xs text-slate-400">{p.source}</span>}
            </div>
            <Relances p={p} />
          </Link>
        ))}
      </div>
    </>
  );
}
