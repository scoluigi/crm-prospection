import { AlertTriangle, PhoneCall, Users } from "lucide-react";
import { getTeamPerformance } from "@/services/stats";
import { getRecentActivity } from "@/services/activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatEuro } from "@/lib/utils";

export default async function TeamPage() {
  const [team, activity] = await Promise.all([getTeamPerformance(), getRecentActivity(30)]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Équipe</h1>
        <p className="text-sm text-slate-500">Qui fait quoi, et où en est chacun.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => (
          <Card key={member.userId}>
            <CardHeader className="flex-row items-center gap-3">
              <UserAvatar name={member.name} color={member.color} size="lg" />
              <div>
                <CardTitle>{member.name}</CardTitle>
                <p className="text-xs text-slate-500">{member.activeProspects} prospects actifs</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5 text-sm">
                <Metric label="Appels aujourd'hui" value={member.callsToday} icon={PhoneCall} />
                <Metric label="Appels 7 jours" value={member.callsWeek} />
                <Metric label="Prospects chauds" value={member.hotProspects} />
                <Metric label="Gagnés" value={member.won} tone="success" />
                <Metric label="Tâches ouvertes" value={member.openTasks} />
                <Metric
                  label="En retard"
                  value={member.overdueTasks + member.overdueReminders}
                  tone={member.overdueTasks + member.overdueReminders > 0 ? "danger" : "default"}
                  icon={member.overdueTasks + member.overdueReminders > 0 ? AlertTriangle : undefined}
                />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-500">Pipeline en cours</span>
                <span className="font-semibold text-slate-700">{formatEuro(member.pipelineAmount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-500">Terminées aujourd&apos;hui</span>
                <span className="font-semibold text-slate-700">{member.doneTasksToday}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente de l&apos;équipe</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <EmptyState icon={Users} title="Aucune activité pour l'instant" className="py-6" />
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {activity.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2.5 py-2 first:pt-0">
                  <UserAvatar name={entry.userName ?? "Système"} color={entry.userColor} size="sm" />
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{entry.message}</p>
                  <span className="shrink-0 text-xs text-slate-400">{formatDateTime(entry.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "danger";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = {
    default: "text-slate-700",
    success: "text-emerald-600",
    danger: "text-rose-600",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-100 px-2.5 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`flex items-center gap-1 text-base font-semibold tabular-nums ${toneClass}`}>
        {Icon && <Icon className="size-3.5" />}
        {value}
      </p>
    </div>
  );
}
