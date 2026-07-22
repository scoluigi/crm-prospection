import { requireUser } from "@/lib/auth";
import { getTeam } from "@/services/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ROLE_LABELS } from "@/lib/constants";

export default async function SettingsPage() {
  const user = await requireUser();
  const team = await getTeam();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500">Ton compte et l&apos;équipe.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <UserAvatar name={user.name} color={user.color} size="lg" />
          <div>
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <Badge className="ml-auto">{ROLE_LABELS[user.role]}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changer mon mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Équipe</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-slate-100">
          {team.map((member) => (
            <div key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <UserAvatar name={member.name} color={member.color} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{member.name}</p>
                <p className="truncate text-xs text-slate-500">{member.email}</p>
              </div>
              <Badge>{ROLE_LABELS[member.role]}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
