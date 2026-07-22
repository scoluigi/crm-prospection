import { requireUser } from "@/lib/auth";
import { getCallQueue } from "@/services/prospects";
import { ColdCallWorkspace } from "@/components/cold-call/cold-call-workspace";

export default async function ColdCallPage() {
  const user = await requireUser();
  const queue = await getCallQueue();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Cold Call</h1>
        <p className="text-sm text-slate-500">
          Enchaîne les appels sans perdre de temps à chercher le prochain prospect.
        </p>
      </div>

      <ColdCallWorkspace queue={queue} currentUserId={user.id} />
    </div>
  );
}
