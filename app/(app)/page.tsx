import { Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getTeam } from "@/services/users";
import { listProspects, type ProspectFilters } from "@/services/prospects";
import { EmptyState } from "@/components/ui/empty-state";
import { NewProspectDialog } from "@/components/prospects/new-prospect-dialog";
import { Button } from "@/components/ui/button";
import { ProspectFilterBar } from "@/components/prospects/prospect-filter-bar";
import { ProspectTable } from "@/components/prospects/prospect-table";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const filters: ProspectFilters = {
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    ownerId: typeof params.owner === "string" ? params.owner : undefined,
    due: (typeof params.due === "string" ? params.due : undefined) as ProspectFilters["due"],
    sort: (typeof params.sort === "string" ? params.sort : undefined) as ProspectFilters["sort"],
  };

  const [team, prospects] = await Promise.all([getTeam(), listProspects(filters)]);
  const hasActiveFilters = Object.values(params).some(Boolean);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
        <p className="text-sm text-slate-500">
          {prospects.length} lead{prospects.length > 1 ? "s" : ""}
        </p>
      </div>

      <ProspectFilterBar team={team} />

      {prospects.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasActiveFilters ? "Aucun lead ne correspond aux filtres" : "Aucun lead pour le moment"}
          description={
            hasActiveFilters
              ? "Élargis la recherche ou réinitialise les filtres."
              : "Ajoute ton premier lead pour commencer à prospecter."
          }
          action={
            !hasActiveFilters && (
              <NewProspectDialog team={team} currentUserId={user.id}>
                <Button size="sm">Ajouter un lead</Button>
              </NewProspectDialog>
            )
          }
        />
      ) : (
        <ProspectTable prospects={prospects} team={team} />
      )}
    </div>
  );
}
