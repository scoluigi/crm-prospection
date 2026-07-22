"use client";

import {
  INTEREST_LABELS,
  INTEREST_LEVELS,
  LEAD_SOURCES,
  PROSPECT_STATUSES,
  STATUS_LABELS,
} from "@/lib/constants";
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

/**
 * Champs partagés entre la création et l'édition d'un prospect.
 * Composant non contrôlé : les valeurs sont lues par le Server Action via `FormData`.
 */
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
      <Field label="Nom de l'entreprise *" htmlFor="companyName" className="sm:col-span-2">
        <Input
          id="companyName"
          name="companyName"
          defaultValue={p?.companyName ?? ""}
          placeholder="Débarras Metz"
          required
          autoFocus={!p}
        />
      </Field>

      <Field label="Nom du contact" htmlFor="contactName">
        <Input id="contactName" name="contactName" defaultValue={p?.contactName ?? ""} placeholder="Jean Dupont" />
      </Field>

      <Field label="Téléphone" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={p?.phone ?? ""} placeholder="06 12 34 56 78" />
      </Field>

      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={p?.email ?? ""} placeholder="contact@entreprise.fr" />
      </Field>

      <Field label="Site web existant" htmlFor="website">
        <Input id="website" name="website" defaultValue={p?.website ?? ""} placeholder="entreprise.fr ou « aucun »" />
      </Field>

      <Field label="Secteur d'activité" htmlFor="sector">
        <Input id="sector" name="sector" defaultValue={p?.sector ?? ""} placeholder="Pisciniste" />
      </Field>

      <Field label="Ville / zone" htmlFor="city">
        <Input id="city" name="city" defaultValue={p?.city ?? ""} placeholder="Metz" />
      </Field>

      <Field label="Source du lead">
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

      <Field label="Associé responsable *">
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

      <Field label="Statut commercial">
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

      <Field label="Niveau d'intérêt">
        <Select name="interest" defaultValue={p?.interest ?? "inconnu"}>
          <SelectTrigger>
            <SelectValue placeholder="Intérêt" />
          </SelectTrigger>
          <SelectContent>
            {INTEREST_LEVELS.map((i) => (
              <SelectItem key={i} value={i}>
                {INTEREST_LABELS[i]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Montant estimé (€)" htmlFor="estimatedAmount">
        <Input
          id="estimatedAmount"
          name="estimatedAmount"
          inputMode="decimal"
          defaultValue={p?.estimatedAmount ?? ""}
          placeholder="1500"
        />
      </Field>

      <Field label="Prochaine relance" htmlFor="nextFollowUp">
        <Input id="nextFollowUp" name="nextFollowUp" type="date" defaultValue={p?.nextFollowUp ?? ""} />
      </Field>

      <Field label="Besoin identifié" htmlFor="identifiedNeed" className="sm:col-span-2">
        <Input
          id="identifiedNeed"
          name="identifiedNeed"
          defaultValue={p?.identifiedNeed ?? ""}
          placeholder="Site vitrine 5 pages + réservation en ligne"
        />
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
