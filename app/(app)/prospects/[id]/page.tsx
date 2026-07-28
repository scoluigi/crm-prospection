import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Phone, PhoneCall } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProspect } from "@/services/prospects";
import { getProspectCalls } from "@/services/calls";
import { getProspectActivity } from "@/services/activity";
import { getTeam } from "@/services/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { CallOutcomeBadge, DueBadge } from "@/components/shared/badges";
import { QuickStatusSelect } from "@/components/prospects/quick-status-select";
import { QuickOwnerSelect } from "@/components/prospects/quick-owner-select";
import { EditProspectDialog } from "@/components/prospects/edit-prospect-dialog";
import { LogCall } from "@/components/prospects/log-call";
import { ActivityTimeline } from "@/components/prospects/activity-timeline";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();

  const prospect = await getProspect(id);
  if (!prospect) notFound();

  const [calls, activity, team] = await Promise.all([
    getProspectCalls(id),
    getProspectActivity(id),
    getTeam(),
  ]);

  const relances = [
    { n: 1, date: prospect.relance1 },
    { n: 2, date: prospect.relance2 },
    { n: 3, date: prospect.relance3 },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="mb-1 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
            <ArrowLeft className="size-3.5" />
            Retour aux leads
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">{prospect.companyName}</h1>
          <div className="mt-1.5">
            <QuickStatusSelect prospectId={prospect.id} status={prospect.status} />
          </div>
        </div>
        <EditProspectDialog prospect={prospect} team={team} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={Building2} label="Contact" value={prospect.contactName} />
              <InfoRow
                icon={Phone}
                label="Téléphone"
                value={prospect.phone}
                href={prospect.phone ? `tel:${prospect.phone}` : undefined}
              />
              <InfoRow icon={MapPin} label="Où as-tu eu le lead" value={prospect.source} />
              {prospect.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-400">Notes</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{prospect.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <PhoneCall className="size-4 text-indigo-500" />
                Enregistrer un appel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LogCall prospectId={prospect.id} />
            </CardContent>
          </Card>

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
                          {call.outcome ? (
                            <CallOutcomeBadge outcome={call.outcome} />
                          ) : (
                            <span className="text-sm font-medium text-slate-600">Appel</span>
                          )}
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

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline entries={activity} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Responsable</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickOwnerSelect prospectId={prospect.id} ownerId={prospect.ownerId} team={team} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relances</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {relances.map((r) => (
                <div key={r.n} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-500">{r.n}re relance</span>
                  {r.date ? (
                    <DueBadge date={r.date} />
                  ) : (
                    <span className="text-xs text-slate-300">non planifiée</span>
                  )}
                </div>
              ))}
              <p className="mt-1 text-xs text-slate-400">
                Modifie les dates via « Modifier » en haut.
              </p>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
        <Icon className="size-3" />
        {label}
      </p>
      {value ? (
        href ? (
          <a href={href} className="mt-0.5 block truncate text-sm text-indigo-600 hover:underline">
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
