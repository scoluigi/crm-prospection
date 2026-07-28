import { requireUser } from "@/lib/auth";
import { getLeaderboard } from "@/services/leaderboard";
import { Leaderboard } from "@/components/classement/leaderboard";

export default async function ClassementPage() {
  await requireUser();
  const rows = await getLeaderboard();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Classement</h1>
        <p className="text-sm text-slate-500">
          Qui prospecte le plus ? Un peu de concurrence saine entre associés.
        </p>
      </div>
      <Leaderboard rows={rows} />
    </div>
  );
}
