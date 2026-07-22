import { requireUser } from "@/lib/auth";
import { getTeam } from "@/services/users";
import { getTodayTasks } from "@/services/tasks";
import { countOverdueReminders, getReminderBuckets } from "@/services/reminders";
import { countNeverContacted } from "@/services/stats";
import { AppShell, type NavCounts } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [team, todayTasks, reminders, neverContacted] = await Promise.all([
    getTeam(),
    getTodayTasks(user.id),
    getReminderBuckets(),
    countNeverContacted(),
  ]);

  const counts: NavCounts = {
    todo: todayTasks.mine.length + todayTasks.overdue.length,
    relances: reminders.overdue.length + reminders.today.length,
    coldcall: neverContacted,
  };

  return (
    <AppShell user={user} team={team} counts={counts}>
      {children}
    </AppShell>
  );
}
