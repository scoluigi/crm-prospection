import { UserAvatar } from "@/components/ui/avatar";
import { formatEuro } from "@/lib/utils";
import type { UserPerformance } from "@/services/stats";

export function TeamPerformanceList({ team }: { team: UserPerformance[] }) {
  const maxCalls = Math.max(1, ...team.map((t) => t.callsToday));

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {team.map((member) => (
        <div key={member.userId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <UserAvatar name={member.name} color={member.color} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-slate-800">{member.name}</p>
              <p className="shrink-0 text-xs font-medium text-slate-500">
                {member.callsToday} appel{member.callsToday > 1 ? "s" : ""} aujourd&apos;hui
              </p>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${(member.callsToday / maxCalls) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
              <span>{member.activeProspects} prospects actifs</span>
              <span>{member.hotProspects} chauds</span>
              <span className={member.overdueTasks > 0 ? "font-medium text-rose-600" : ""}>
                {member.overdueTasks} tâche{member.overdueTasks > 1 ? "s" : ""} en retard
              </span>
              <span>{formatEuro(member.pipelineAmount)} en pipeline</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
