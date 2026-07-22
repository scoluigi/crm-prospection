/**
 * Définition des champs importables et détection automatique du mapping.
 * Ce module est partagé serveur/client : il ne doit contenir aucune dépendance Node.
 */

import { PROSPECT_STATUSES, STATUS_LABELS, type ProspectStatus } from "@/lib/constants";
import { normalize } from "@/lib/utils";

export const IMPORT_FIELDS = [
  { key: "companyName", label: "Nom de l'entreprise", required: true },
  { key: "contactName", label: "Nom du contact", required: false },
  { key: "phone", label: "Téléphone", required: false },
  { key: "email", label: "Email", required: false },
  { key: "website", label: "Site web existant", required: false },
  { key: "sector", label: "Secteur d'activité", required: false },
  { key: "city", label: "Ville / zone", required: false },
  { key: "source", label: "Source du lead", required: false },
  { key: "status", label: "Statut commercial", required: false },
  { key: "ownerName", label: "Associé responsable", required: false },
  { key: "estimatedAmount", label: "Montant estimé", required: false },
  { key: "identifiedNeed", label: "Besoin identifié", required: false },
  { key: "nextFollowUp", label: "Prochaine relance", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

/** Mapping colonne CSV → champ CRM. La valeur `""` signifie « ignorer cette colonne ». */
export type ColumnMapping = Record<string, ImportFieldKey | "">;

/**
 * Synonymes d'en-têtes reconnus, y compris ceux du Google Sheet actuel
 * (« Membre à l'origine », « Type de prestation », « Prix de la prestation »…).
 */
const HEADER_ALIASES: Record<ImportFieldKey, string[]> = {
  companyName: ["nomdelentreprise", "entreprise", "societe", "client", "nom", "company"],
  contactName: ["nomducontact", "contact", "interlocuteur", "prenomnom", "responsable"],
  phone: ["telephone", "tel", "portable", "mobile", "numero", "phone"],
  email: ["email", "mail", "adressemail", "courriel"],
  website: ["siteweb", "sitewebexistant", "urldusitelivre", "url", "website", "site"],
  sector: ["secteurdactivite", "secteur", "activite", "metier", "industrie"],
  city: ["ville", "zone", "villezone", "localisation", "departement", "region"],
  source: ["sourcedulead", "source", "origine", "provenance", "canal"],
  status: ["statut", "statutcommercial", "etat", "status"],
  ownerName: [
    "membrealorigine",
    "associeresponsable",
    "responsable",
    "associe",
    "membre",
    "owner",
    "commercial",
  ],
  estimatedAmount: [
    "prixdelaprestation",
    "montantestime",
    "montant",
    "prix",
    "budget",
    "ca",
    "valeur",
  ],
  identifiedNeed: ["typedeprestation", "besoinidentifie", "besoin", "prestation", "produit"],
  nextFollowUp: ["prochainerelance", "relance", "datederelance", "arelancerle"],
  notes: ["notes", "note", "commentaire", "commentaires", "remarques"],
};

/** Devine le mapping à partir des en-têtes du fichier. */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<ImportFieldKey>();

  for (const header of headers) {
    const key = normalize(header);
    let match: ImportFieldKey | "" = "";

    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
      ImportFieldKey,
      string[],
    ][]) {
      if (used.has(field)) continue;
      if (aliases.some((alias) => key === alias || (key.length > 3 && key.includes(alias)))) {
        match = field;
        break;
      }
    }

    if (match) used.add(match);
    mapping[header] = match;
  }

  return mapping;
}

/**
 * Convertit un libellé de statut libre vers un statut CRM.
 * Tolère les valeurs du Google Sheet (« En cours », « Perdu »…).
 */
export function parseStatus(raw: string | undefined | null): ProspectStatus | null {
  if (!raw) return null;
  const key = normalize(raw);
  if (!key) return null;

  // Correspondance directe sur la clé technique ou le libellé officiel.
  for (const status of PROSPECT_STATUSES) {
    if (normalize(status) === key || normalize(STATUS_LABELS[status]) === key) return status;
  }

  const extra: Record<string, ProspectStatus> = {
    encours: "interesse",
    enconstruction: "interesse",
    nouveau: "a_contacter",
    acontacter: "a_contacter",
    arelancer: "a_relancer",
    relance: "a_relancer",
    appele: "appele",
    contacte: "appele",
    rdv: "rdv_pris",
    rendezvous: "rdv_pris",
    devis: "devis_envoye",
    proposition: "devis_envoye",
    signe: "gagne",
    client: "gagne",
    gagne: "gagne",
    livre: "gagne",
    perdu: "perdu",
    refus: "pas_interesse",
    pasinteresse: "pas_interesse",
    norep: "a_relancer",
  };

  return extra[key] ?? null;
}

/** Convertit une date libre (`12/03/2026`, `2026-03-12`) en ISO `YYYY-MM-DD`. */
export function parseDateLoose(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const fr = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (fr) {
    const [, d, m, y] = fr;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(
      parsed.getDate(),
    ).padStart(2, "0")}`;
  }

  return null;
}
