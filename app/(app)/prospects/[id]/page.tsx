import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProspect } from "@/services/prospects";
import { getProspectCalls } from "@/services/calls";
import { getReminderHistory } from "@/services/reminders";
import { getProspectNotes } from "@/services/notes";
import { getProspectActivity } from "@/services/activity";
import { listTasks } from "@/services/tasks";
import { getTeam } from "@/services/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { CallOutcomeBadge, InterestBadge } from "@/components/shared/badges";
import { QuickStatusSelect } from "@/components/prospects/quick-status-select";
import { QuickOwnerSelect } from "@/components/prospects/quick-owner-select";
import { EditProspectDialog } from "@/components/prospects/edit-prospect-dialog";
import { LogCallForm } from "@/components/calls/log-call-form";
import { NotesPanel } from "@/components/prospects/notes-panel";
import { ActivityTimeline } from "@/components/prospects/activity-timeline";
import { ScheduleReminderForm } from "@/components/reminders/schedule-reminder-form";
import { ReminderRow } from "@/components/reminders/reminder-row";
import { TaskRow } from "@/components/tasks/task-row";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { ensureHttp, formatDate, formatDateTime, formatEuro } from "@/lib/utils";
import { PhoneCall } from "lucide-react";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const prospect = await getProspect(id);
  if (!prospect) notFound();

  const [calls, reminders, notes, activity, tasks, team] = await Promise.all([
    getProspectCalls(id),
    getReminderHistory(id),
    getProspectNotes(id),
    getProspectActivity(id),
    listTasks({ prospectId: id }),
    getTeam(),
  ]);

  const pendingReminders = reminders.filter((r) => r.status === "pending");
  const pastReminders = reminders.filter((r) => r.status !== "pending");
  const website = ensureHttp(prospect.website);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/prospects" className="mb-1 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
            <ArrowLeft className="size-3.5" />
            Retour aux prospects
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">{prospect.companyName}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <QuickStatusSelect prospectId={prospect.id} status={prospect.status} />
            <InterestBadge level={prospect.interest} />
            {prospect.estimatedAmount ? (
              <Badge className="bg-white text-slate-600">{formatEuro(prospect.estimatedAmount)}</Badge>
            ) : null}
          </div>
        </div>
        <EditProspectDialog prospect={prospect} team={team} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Coordonnées */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={Building2} label="Contact" value={prospect.contactName} />
              <InfoRow
                icon={Phone}
                label="Téléphone"
                value={prospect.phone}
                href={prospect.phone ? `tel:${prospect.phone}` : undefined}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={prospect.email}
                href={prospect.email ? `mailto:${prospect.email}` : undefined}
              />
              <InfoRow icon={Globe} label="Site actuel" value={prospect.website} href={website ?? undefined} external />
              <InfoRow icon={MapPin} label="Ville / secteur" value={[prospect.city, prospect.sector].filter(Boolean).join(" · ") || null} />
              <InfoRow icon={Wallet} label="Source du lead" value={prospect.source} />
              <InfoRow icon={Lightbulb} label="Besoin identifié" value={prospect.identifiedNeed} className="sm:col-span-2" />
              {prospect.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-400">Notes de création</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{prospect.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enregistrer un appel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <PhoneCall className="size-4 text-indigo-500" />
                Enregistrer un appel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LogCallForm prospectId={prospect.id} />
            </CardContent>
          </Card>

          {/* Historique des appels */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des appels ({calls.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <EmptyState icon={PhoneCall} title="Aucun appel enregistré" className="py-6" />
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {calls.map((call) => (
                    <div key={call.id} className="flex items-start gap-2.5 py-2.5 first:pt-0">
                      <UserAvatar name={call.userName ?? "?"} color={call.userColor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <CallOutcomeBadge outcome={call.outcome} />
                          <span className="text-xs text-slate-400">{formatDateTime(call.calledAt)}</span>
                        </div>
                        {call.notes && <p className="mt-1 text-sm text-slate-600">{call.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes internes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes internes</CardTitle>
            </CardHeader>
            <CardContent>
              <NotesPanel prospectId={prospect.id} notes={notes} />
            </CardContent>
          </Card>

          {/* Historique complet */}
          <Card>
            <CardHeader>
              <CardTitle>Historique complet</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline entries={activity} />
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Responsable</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickOwnerSelect prospectId={prospect.id} ownerId={prospect.ownerId} team={team} />
              <p className="mt-2 text-xs text-slate-400">
                Créé le {formatDate(new Date(prospect.createdAt).toISOString().slice(0, 10))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relances</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ScheduleReminderForm prospectId={prospect.id} team={team} currentUserId={user.id} />

              {pendingReminders.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune relance planifiée.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingReminders.map((r) => (
                    <ReminderRow key={r.id} reminder={r} showProspectLink={false} />
                  ))}
                </div>
              )}

              {pastReminders.length > 0 && (
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer select-none font-medium">
                    Historique ({pastReminders.length})
                  </summary>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {pastReminders.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5">
                        <span>{formatDate(r.dueDate)}</span>
                        <Badge className={r.status === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-neutral-50 text-neutral-500"}>
                          {r.status === "done" ? "Effectuée" : "Annulée"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Tâches liées</CardTitle>
              <NewTaskDialog
                team={team}
                currentUserId={user.id}
                prospectId={prospect.id}
                prospectName={prospect.companyName}
                trigger={<Button size="sm" variant="secondary">Ajouter</Button>}
              />
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune tâche liée à ce prospect.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {tasks.map((t) => (
                    <TaskRow key={t.id} task={t} showProspectLink={false} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  external,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  href?: string;
  external?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
        <Icon className="size-3" />
        {label}
      </p>
      {value ? (
        href ? (
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="mt-0.5 block truncate text-sm text-indigo-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-sm text-slate-700">{value}</p>
        )
      ) : (
        <p className="mt-0.5 text-sm text-slate-300">—</p>
      )}
    </div>
  );
}
