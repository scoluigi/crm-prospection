"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { DueBadge, InterestBadge, StatusBadge } from "@/components/shared/badges";
import { formatEuro } from "@/lib/utils";
import type { ProspectWithOwner } from "@/services/prospects";
import type { TeamMember } from "@/services/users";

export function ProspectTable({
  prospects,
}: {
  prospects: ProspectWithOwner[];
  team: TeamMember[];
}) {
  return (
    <>
      {/* Vue tableau — desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-2.5">Entreprise</th>
              <th className="px-4 py-2.5">Contact</th>
              <th className="px-4 py-2.5">Statut</th>
              <th className="px-4 py-2.5">Intérêt</th>
              <th className="px-4 py-2.5">Responsable</th>
              <th className="px-4 py-2.5">Relance</th>
              <th className="px-4 py-2.5 text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prospects.map((p) => (
              <tr key={p.id} className="group transition-colors hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link href={`/prospects/${p.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                    {p.companyName}
                  </Link>
                  {p.city && <p className="text-xs text-slate-400">{p.city}</p>}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  <p className="truncate">{p.contactName ?? "—"}</p>
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600"
                    >
                      <Phone className="size-3" />
                      {p.phone}
                    </a>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-2.5">
                  <InterestBadge level={p.interest} />
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
                  <DueBadge date={p.nextFollowUp} />
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-slate-700">
                  {formatEuro(p.estimatedAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue cartes — mobile / tablette */}
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
                  {p.contactName ?? p.phone ?? "Aucun contact renseigné"}
                </p>
              </div>
              {p.ownerName && <UserAvatar name={p.ownerName} color={p.ownerColor} size="sm" />}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={p.status} />
              <InterestBadge level={p.interest} />
              <DueBadge date={p.nextFollowUp} />
            </div>
            {p.estimatedAmount ? (
              <p className="text-xs font-medium text-slate-500">{formatEuro(p.estimatedAmount)}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </>
  );
}
