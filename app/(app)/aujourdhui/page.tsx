import { CalendarClock, CheckSquare, Flame, PhoneCall, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getTeam } from "@/services/users";
import { getTodayTasks } from "@/services/tasks";
import { getReminderBuckets } from "@/services/reminders";
import { getHotProspects } from "@/services/stats";
import { getTodayCalls } from "@/services/calls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/ui/avatar";
import { CallOutcomeBadge, DueBadge, InterestBadge } from "@/components/shared/badges";
import { TaskRow } from "@/components/tasks/task-row";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { ReminderRow } from "@/components/reminders/reminder-row";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export default async function TodayPage() {
  const user = await requireUser();
  const [team, todayTasks, reminders, hotProspects, todayCalls] = await Promise.all([
    getTeam(),
    getTodayTasks(user.id),
    getReminderBuckets(user.id),
    getHotProspects(user.id, 5),
    getTodayCalls(user.id),
  ]);

  const dueReminders = [...reminders.overdue, ...reminders.today];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Aujourd&apos;hui</h1>
          <p className="text-sm text-slate-500">
            Ta journée de prospection, {user.name.split(" ")[0]}.
          </p>
        </div>
        <NewTaskDialog team={team} currentUserId={user.id} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Relances du jour */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-1.5">
              <CalendarClock className="size-4 text-amber-500" />
              Relances à faire ({dueReminders.length})
            </CardTitle>
            <Link href="/relances" className="text-xs font-medium text-indigo-600 hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent>
            {dueReminders.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Aucune relance en attente" className="py-6" />
            ) : (
              <div className="flex flex-col gap-2">
                {dueReminders.map((r) => (
                  <ReminderRow key={r.id} reminder={r} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prospects chauds à suivre */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Flame className="size-4 text-rose-500" />
              Prospects chauds à suivre
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotProspects.length === 0 ? (
              <EmptyState icon={Flame} title="Aucun prospect chaud pour l'instant" className="py-6" />
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {hotProspects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/prospects/${p.id}`}
                    className="flex items-center justify-between gap-2 py-2 first:pt-0 hover:text-indigo-600"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{p.companyName}</p>
                      <p className="truncate text-xs text-slate-500">{p.contactName ?? p.phone ?? "—"}</p>
                    </div>
                    <InterestBadge level={p.interest} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mes tâches */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-1.5">
              <CheckSquare className="size-4 text-indigo-500" />
              Mes tâches ({todayTasks.mine.length + todayTasks.overdue.filter((t) => t.assigneeId === user.id).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.mine.length === 0 && todayTasks.overdue.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Rien à faire aujourd'hui" description="Profites-en pour prospecter de nouveaux contacts." className="py-6" />
            ) : (
              <div className="flex flex-col gap-2">
                {todayTasks.overdue
                  .filter((t) => t.assigneeId === user.id)
                  .map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                {todayTasks.mine.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tâches communes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-1.5">
              <Users className="size-4 text-slate-500" />
              Tâches communes ({todayTasks.shared.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.shared.length === 0 ? (
              <EmptyState icon={Users} title="Aucune tâche commune" className="py-6" />
            ) : (
              <div className="flex flex-col gap-2">
                {todayTasks.shared.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appels du jour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <PhoneCall className="size-4 text-emerald-500" />
            Mes appels du jour ({todayCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayCalls.length === 0 ? (
            <EmptyState icon={PhoneCall} title="Aucun appel passé aujourd'hui" description="Direction le module Cold Call pour démarrer." className="py-6" />
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {todayCalls.map((call) => (
                <div key={call.id} className="flex items-center gap-3 py-2 first:pt-0">
                  <UserAvatar name={call.userName ?? "?"} color={call.userColor} size="sm" />
                  <Link href={`/prospects/${call.prospectId}`} className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 hover:text-indigo-600">
                    {call.companyName}
                  </Link>
                  <CallOutcomeBadge outcome={call.outcome} />
                  <span className="w-16 shrink-0 text-right text-xs text-slate-400">
                    {formatDateTime(call.calledAt).split(" ").pop()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
