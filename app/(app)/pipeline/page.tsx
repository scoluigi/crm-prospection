import { listProspects } from "@/services/prospects";
import { KanbanBoard } from "@/components/pipeline/kanban-board";

export default async function PipelinePage() {
  const prospects = await listProspects({ sort: "recent" });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Pipeline commercial</h1>
        <p className="text-sm text-slate-500">
          Glisse-dépose une carte pour changer le statut d&apos;un prospect.
        </p>
      </div>

      <KanbanBoard prospects={prospects} />
    </div>
  );
}
