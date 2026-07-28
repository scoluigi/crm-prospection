"use client";

import { LEAD_SOURCES, PROSPECT_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamMember } from "@/services/users";
import type { ProspectWithOwner } from "@/services/prospects";

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/** Champs d'un lead — création & édition. Non contrôlé : lu via FormData par le Server Action. */
export function ProspectFormFields({
  team,
  defaultOwnerId,
  prospect,
}: {
  team: TeamMember[];
  defaultOwnerId: string;
  prospect?: ProspectWithOwner;
}) {
  const p = prospect;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Entreprise *" htmlFor="companyName" className="sm:col-span-2">
        <Input
          id="companyName"
          name="companyName"
          defaultValue={p?.companyName ?? ""}
          placeholder="Débarras Metz"
          required
          autoFocus={!p}
        />
      </Field>

      <Field label="Contact" htmlFor="contactName">
        <Input id="contactName" name="contactName" defaultValue={p?.contactName ?? ""} placeholder="Jean Dupont" />
      </Field>

      <Field label="Téléphone" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={p?.phone ?? ""} placeholder="06 12 34 56 78" />
      </Field>

      <Field label="Où as-tu eu le lead ?">
        <Select name="source" defaultValue={p?.source ?? "Cold call"}>
          <SelectTrigger>
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            {LEAD_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Responsable *">
        <Select name="ownerId" defaultValue={p?.ownerId ?? defaultOwnerId}>
          <SelectTrigger>
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Statut" className="sm:col-span-2">
        <Select name="status" defaultValue={p?.status ?? "a_contacter"}>
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {PROSPECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="1re relance" htmlFor="relance1">
        <Input id="relance1" name="relance1" type="date" defaultValue={p?.relance1 ?? ""} />
      </Field>
      <Field label="2e relance" htmlFor="relance2">
        <Input id="relance2" name="relance2" type="date" defaultValue={p?.relance2 ?? ""} />
      </Field>
      <Field label="3e relance" htmlFor="relance3">
        <Input id="relance3" name="relance3" type="date" defaultValue={p?.relance3 ?? ""} />
      </Field>

      <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
        <Textarea
          id="notes"
          name="notes"
          defaultValue={p?.notes ?? ""}
          placeholder="Contexte, objections, éléments à retenir pour le prochain appel…"
          rows={3}
        />
      </Field>
    </div>
  );
}
