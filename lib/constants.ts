/** Constantes métier du CRM — source unique de vérité pour les libellés affichés. */

// Statuts d'un lead (volontairement courts)
export const PROSPECT_STATUSES = [
  "a_contacter",
  "a_relancer",
  "interesse",
  "rdv",
  "gagne",
  "perdu",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  a_contacter: "À contacter",
  a_relancer: "À relancer",
  interesse: "Intéressé",
  rdv: "RDV pris",
  gagne: "Gagné",
  perdu: "Perdu",
};

/** Classes Tailwind du badge de statut. */
export const STATUS_COLORS: Record<ProspectStatus, string> = {
  a_contacter: "bg-slate-100 text-slate-700 border-slate-200",
  a_relancer: "bg-amber-100 text-amber-800 border-amber-200",
  interesse: "bg-violet-100 text-violet-700 border-violet-200",
  rdv: "bg-indigo-100 text-indigo-700 border-indigo-200",
  gagne: "bg-emerald-100 text-emerald-700 border-emerald-200",
  perdu: "bg-rose-100 text-rose-700 border-rose-200",
};

/** Statuts « encore en jeu » (ni gagné ni perdu). */
export const ACTIVE_STATUSES: ProspectStatus[] = ["a_contacter", "a_relancer", "interesse", "rdv"];

// Résultat d'un appel (optionnel, quand on log depuis une fiche)
export const CALL_OUTCOMES = [
  "pas_repondu",
  "a_rappeler",
  "interesse",
  "rdv",
  "pas_interesse",
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  pas_repondu: "Pas répondu",
  a_rappeler: "À rappeler",
  interesse: "Intéressé",
  rdv: "RDV pris",
  pas_interesse: "Pas intéressé",
};

/** Statut appliqué au lead après un appel avec ce résultat (optionnel). */
export const CALL_OUTCOME_STATUS: Record<CallOutcome, ProspectStatus | null> = {
  pas_repondu: "a_relancer",
  a_rappeler: "a_relancer",
  interesse: "interesse",
  rdv: "rdv",
  pas_interesse: "perdu",
};

// D'où vient le lead
export const LEAD_SOURCES = [
  "Cold call",
  "Google Maps",
  "LinkedIn",
  "Recommandation",
  "Site web",
  "Instagram",
  "Réseau perso",
  "Salon / événement",
  "Autre",
] as const;

// Rôles
export const USER_ROLES = ["associe", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  associe: "Associé",
  admin: "Admin",
};

// Journal d'activité
export const ACTIVITY_TYPES = [
  "prospect_cree",
  "statut_change",
  "appel_effectue",
  "responsable_change",
  "note_modifiee",
  "relance_planifiee",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  prospect_cree: "Lead créé",
  statut_change: "Statut modifié",
  appel_effectue: "Appel passé",
  responsable_change: "Responsable modifié",
  note_modifiee: "Note modifiée",
  relance_planifiee: "Relance planifiée",
};
