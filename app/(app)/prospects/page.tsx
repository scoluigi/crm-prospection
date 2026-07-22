import { Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getTeam } from "@/services/users";
import { getFilterOptions, listProspects, type ProspectFilters } from "@/services/prospects";
import { EmptyState } from "@/components/ui/empty-state";
import { NewProspectDialog } from "@/components/prospects/new-prospect-dialog";
import { Button } from "@/components/ui/button";
import { ProspectFilterBar } from "@/components/prospects/prospect-filter-bar";
import { ProspectTable } from "@/components/prospects/prospect-table";

export default async function ProspectsPage({
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
    interest: typeof params.interest === "string" ? params.interest : undefined,
    city: typeof params.city === "string" ? params.city : undefined,
    sector: typeof params.sector === "string" ? params.sector : undefined,
    due: (typeof params.due === "string" ? params.due : undefined) as ProspectFilters["due"],
    sort: (typeof params.sort === "string" ? params.sort : undefined) as ProspectFilters["sort"],
  };

  const [team, prospects, options] = await Promise.all([
    getTeam(),
    listProspects(filters),
    getFilterOptions(),
  ]);

  const hasActiveFilters = Object.values(params).some(Boolean);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Prospects</h1>
          <p className="text-sm text-slate-500">
            {prospects.length} prospect{prospects.length > 1 ? "s" : ""} affiché
            {prospects.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <ProspectFilterBar team={team} cities={options.cities} sectors={options.sectors} />

      {prospects.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasActiveFilters ? "Aucun prospect ne correspond à ces filtres" : "Aucun prospect pour le moment"}
          description={
            hasActiveFilters
              ? "Essaie d'élargir la recherche ou de réinitialiser les filtres."
              : "Ajoute ton premier prospect ou importe ton fichier existant."
          }
          action={
            !hasActiveFilters && (
              <NewProspectDialog team={team} currentUserId={user.id}>
                <Button size="sm">Créer un prospect</Button>
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
