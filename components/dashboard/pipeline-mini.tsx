import Link from "next/link";
import { PIPELINE_COLUMNS, STATUS_DOTS, STATUS_LABELS } from "@/lib/constants";
import type { DashboardStats } from "@/services/stats";
import { formatEuro } from "@/lib/utils";

export function PipelineMini({ byStatus }: { byStatus: DashboardStats["byStatus"] }) {
  const map = new Map(byStatus.map((s) => [s.status, s]));
  const max = Math.max(1, ...PIPELINE_COLUMNS.map((s) => map.get(s)?.count ?? 0));

  return (
    <div className="flex flex-col gap-2.5">
      {PIPELINE_COLUMNS.map((status) => {
        const row = map.get(status);
        const count = row?.count ?? 0;
        return (
          <Link
            key={status}
            href={`/prospects?status=${status}`}
            className="group flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-50"
          >
            <span className={`size-2 shrink-0 rounded-full ${STATUS_DOTS[status]}`} />
            <span className="w-24 shrink-0 truncate text-xs text-slate-600 group-hover:text-slate-900">
              {STATUS_LABELS[status]}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${STATUS_DOTS[status]} opacity-70`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700">
              {count}
            </span>
            {row && row.amount > 0 && (
              <span className="hidden w-20 shrink-0 text-right text-[11px] text-slate-400 sm:block">
                {formatEuro(row.amount)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
