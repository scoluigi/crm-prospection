import Link from "next/link";
import {
  CalendarClock,
  Clock,
  Flame,
  PhoneCall,
  ReceiptText,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardStats, getHotProspects, getTeamPerformance } from "@/services/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TeamPerformanceList } from "@/components/dashboard/team-performance";
import { PipelineMini } from "@/components/dashboard/pipeline-mini";
import { InterestBadge, StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEuro } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, team, hotProspects] = await Promise.all([
    getDashboardStats(),
    getTeamPerformance(),
    getHotProspects(undefined, 6),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {greeting}, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-500">Voici où en est la prospection aujourd&apos;hui.</p>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Prospects au total"
          value={stats.totalProspects}
          hint={`${stats.activeProspects} actifs`}
          href="/prospects"
        />
        <StatCard
          icon={CalendarClock}
          label="À relancer aujourd'hui"
          value={stats.followUpsToday}
          hint={stats.followUpsOverdue > 0 ? `${stats.followUpsOverdue} en retard` : "Aucun retard"}
          href="/relances"
          tone={stats.followUpsToday > 0 ? "warning" : "default"}
        />
        <StatCard
          icon={PhoneCall}
          label="Appels effectués aujourd'hui"
          value={stats.callsToday}
          hint={`${stats.callsThisWeek} cette semaine`}
          href="/cold-call"
          tone="success"
        />
        <StatCard
          icon={Users}
          label="Rendez-vous planifiés"
          value={stats.meetingsPlanned}
          href="/prospects?status=rdv_pris"
        />
        <StatCard
          icon={Flame}
          label="Opportunités chaudes"
          value={stats.hotOpportunities}
          hint={formatEuro(stats.pipelineAmount)}
          href="/pipeline"
          tone="warning"
        />
        <StatCard
          icon={ReceiptText}
          label="Devis envoyés"
          value={stats.quotesSent}
          href="/prospects?status=devis_envoye"
        />
        <StatCard
          icon={Clock}
          label="Tâches en retard"
          value={stats.overdueTasks}
          hint={`${stats.openTasks} en cours`}
          href="/aujourdhui"
          tone={stats.overdueTasks > 0 ? "danger" : "default"}
        />
        <StatCard
          icon={Flame}
          label="Gagnés"
          value={stats.wonCount}
          hint={formatEuro(stats.wonAmount)}
          href="/prospects?status=gagne"
          tone="success"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Performance par associé */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance par associé</CardTitle>
          </CardHeader>
          <CardContent>
            {team.length > 0 ? (
              <TeamPerformanceList team={team} />
            ) : (
              <EmptyState icon={Users} title="Aucun associé actif" />
            )}
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pipeline commercial</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineMini byStatus={stats.byStatus} />
          </CardContent>
        </Card>
      </div>

      {/* Opportunités chaudes */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Opportunités chaudes à suivre</CardTitle>
          <Link href="/prospects?due=all&status=all&interest=chaud" className="text-xs font-medium text-indigo-600 hover:underline">
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          {hotProspects.length === 0 ? (
            <EmptyState icon={Flame} title="Aucune opportunité chaude pour le moment" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hotProspects.map((p) => (
                <Link
                  key={p.id}
                  href={`/prospects/${p.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{p.companyName}</p>
                    {p.ownerName && <UserAvatar name={p.ownerName} color={p.ownerColor} size="sm" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={p.status} />
                    <InterestBadge level={p.interest} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{p.contactName ?? p.phone ?? "—"}</span>
                    {p.estimatedAmount ? (
                      <Badge className="bg-white text-slate-600">{formatEuro(p.estimatedAmount)}</Badge>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
