import { AlertTriangle, CalendarCheck, CalendarClock } from "lucide-react";
import { getReminderBuckets } from "@/services/reminders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ReminderRow } from "@/components/reminders/reminder-row";

export default async function RemindersPage() {
  const buckets = await getReminderBuckets();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Relances</h1>
        <p className="text-sm text-slate-500">Toute l&apos;équipe, triée par urgence.</p>
      </div>

      <Card className={buckets.overdue.length > 0 ? "border-rose-200" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-rose-600">
            <AlertTriangle className="size-4" />
            En retard ({buckets.overdue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buckets.overdue.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="Aucune relance en retard, bravo !" className="py-6" />
          ) : (
            <div className="flex flex-col gap-2">
              {buckets.overdue.map((r) => (
                <ReminderRow key={r.id} reminder={r} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-amber-600">
            <CalendarClock className="size-4" />
            Aujourd&apos;hui ({buckets.today.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buckets.today.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Rien de prévu aujourd'hui" className="py-6" />
          ) : (
            <div className="flex flex-col gap-2">
              {buckets.today.map((r) => (
                <ReminderRow key={r.id} reminder={r} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-slate-600">
            <CalendarClock className="size-4" />
            À venir ({buckets.upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buckets.upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Aucune relance planifiée à l'avance" className="py-6" />
          ) : (
            <div className="flex flex-col gap-2">
              {buckets.upcoming.map((r) => (
                <ReminderRow key={r.id} reminder={r} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
