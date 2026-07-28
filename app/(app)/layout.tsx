import { requireUser } from "@/lib/auth";
import { getTeam } from "@/services/users";
import { callsReportedToday, getActiveSession } from "@/services/sessions";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [team, session, callsToday] = await Promise.all([
    getTeam(),
    getActiveSession(user.id),
    callsReportedToday(user.id),
  ]);

  return (
    <AppShell
      user={user}
      team={team}
      pointeuse={{
        active: Boolean(session),
        startedAt: session ? Number(session.startedAt) : null,
        callsToday,
      }}
    >
      {children}
    </AppShell>
  );
}
