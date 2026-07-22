import { requireUser } from "@/lib/auth";
import { getTeam } from "@/services/users";
import { ImportWizard } from "@/components/import/import-wizard";

export default async function ImportPage() {
  const user = await requireUser();
  const team = await getTeam();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Import</h1>
        <p className="text-sm text-slate-500">
          Importe tes prospects depuis un export CSV du Google Sheet, sans créer de doublons.
        </p>
      </div>

      <ImportWizard team={team} currentUserId={user.id} />
    </div>
  );
}
