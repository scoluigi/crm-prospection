/**
 * Constantes métier du CRM.
 * Source unique de vérité pour les statuts, priorités et libellés affichés.
 */

// ---------------------------------------------------------------------------
// Statuts commerciaux
// ---------------------------------------------------------------------------

export const PROSPECT_STATUSES = [
  "a_contacter",
  "appele",
  "a_relancer",
  "interesse",
  "rdv_pris",
  "devis_envoye",
  "gagne",
  "perdu",
  "pas_interesse",
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  a_contacter: "À contacter",
  appele: "Appelé",
  a_relancer: "À relancer",
  interesse: "Intéressé",
  rdv_pris: "RDV pris",
  devis_envoye: "Devis envoyé",
  gagne: "Gagné",
  perdu: "Perdu",
  pas_interesse: "Pas intéressé",
};

/** Classes Tailwind du badge de statut (fond + texte + bordure). */
export const STATUS_COLORS: Record<ProspectStatus, string> = {
  a_contacter: "bg-slate-100 text-slate-700 border-slate-200",
  appele: "bg-sky-100 text-sky-700 border-sky-200",
  a_relancer: "bg-amber-100 text-amber-800 border-amber-200",
  interesse: "bg-violet-100 text-violet-700 border-violet-200",
  rdv_pris: "bg-indigo-100 text-indigo-700 border-indigo-200",
  devis_envoye: "bg-blue-100 text-blue-700 border-blue-200",
  gagne: "bg-emerald-100 text-emerald-700 border-emerald-200",
  perdu: "bg-rose-100 text-rose-700 border-rose-200",
  pas_interesse: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

/** Point de couleur utilisé en tête de colonne Kanban. */
export const STATUS_DOTS: Record<ProspectStatus, string> = {
  a_contacter: "bg-slate-400",
  appele: "bg-sky-500",
  a_relancer: "bg-amber-500",
  interesse: "bg-violet-500",
  rdv_pris: "bg-indigo-500",
  devis_envoye: "bg-blue-500",
  gagne: "bg-emerald-500",
  perdu: "bg-rose-500",
  pas_interesse: "bg-neutral-400",
};

/** Colonnes affichées dans le pipeline Kanban (« Pas intéressé » est exclu, il pollue la vue). */
export const PIPELINE_COLUMNS: ProspectStatus[] = [
  "a_contacter",
  "appele",
  "a_relancer",
  "interesse",
  "rdv_pris",
  "devis_envoye",
  "gagne",
  "perdu",
];

/** Statuts considérés comme « pipeline actif » (ni gagné, ni perdu, ni abandonné). */
export const ACTIVE_STATUSES: ProspectStatus[] = [
  "a_contacter",
  "appele",
  "a_relancer",
  "interesse",
  "rdv_pris",
  "devis_envoye",
];

/** Statuts considérés comme « opportunités chaudes » sur le dashboard. */
export const HOT_STATUSES: ProspectStatus[] = ["interesse", "rdv_pris", "devis_envoye"];

// ---------------------------------------------------------------------------
// Niveau d'intérêt
// ---------------------------------------------------------------------------

export const INTEREST_LEVELS = ["inconnu", "froid", "tiede", "chaud"] as const;
export type InterestLevel = (typeof INTEREST_LEVELS)[number];

export const INTEREST_LABELS: Record<InterestLevel, string> = {
  inconnu: "Inconnu",
  froid: "Froid",
  tiede: "Tiède",
  chaud: "Chaud",
};

export const INTEREST_COLORS: Record<InterestLevel, string> = {
  inconnu: "bg-neutral-100 text-neutral-500 border-neutral-200",
  froid: "bg-sky-100 text-sky-700 border-sky-200",
  tiede: "bg-amber-100 text-amber-800 border-amber-200",
  chaud: "bg-rose-100 text-rose-700 border-rose-200",
};

// ---------------------------------------------------------------------------
// Tâches
// ---------------------------------------------------------------------------

export const TASK_TYPES = [
  "cold_call",
  "relance",
  "email",
  "rendez_vous",
  "administratif",
  "autre",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  cold_call: "Cold call",
  relance: "Relance",
  email: "Email",
  rendez_vous: "Rendez-vous",
  administratif: "Administratif",
  autre: "Autre",
};

export const TASK_PRIORITIES = ["basse", "normale", "haute", "urgente"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  basse: "Basse",
  normale: "Normale",
  haute: "Haute",
  urgente: "Urgente",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  basse: "bg-neutral-100 text-neutral-600 border-neutral-200",
  normale: "bg-sky-100 text-sky-700 border-sky-200",
  haute: "bg-amber-100 text-amber-800 border-amber-200",
  urgente: "bg-rose-100 text-rose-700 border-rose-200",
};

/** Ordre de tri des priorités (du plus urgent au moins urgent). */
export const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgente: 0,
  haute: 1,
  normale: 2,
  basse: 3,
};

export const TASK_STATUSES = ["a_faire", "en_cours", "termine"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};

// ---------------------------------------------------------------------------
// Appels
// ---------------------------------------------------------------------------

export const CALL_OUTCOMES = [
  "pas_repondu",
  "mauvais_numero",
  "a_rappeler",
  "interesse",
  "pas_interesse",
  "rdv_pris",
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  pas_repondu: "Pas répondu",
  mauvais_numero: "Mauvais numéro",
  a_rappeler: "À rappeler",
  interesse: "Intéressé",
  pas_interesse: "Pas intéressé",
  rdv_pris: "RDV pris",
};

export const CALL_OUTCOME_COLORS: Record<CallOutcome, string> = {
  pas_repondu: "bg-slate-100 text-slate-600 border-slate-200",
  mauvais_numero: "bg-neutral-100 text-neutral-600 border-neutral-200",
  a_rappeler: "bg-amber-100 text-amber-800 border-amber-200",
  interesse: "bg-violet-100 text-violet-700 border-violet-200",
  pas_interesse: "bg-rose-100 text-rose-700 border-rose-200",
  rdv_pris: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/**
 * Règles d'automatisation : quel statut prospect appliquer après un appel,
 * et dans combien de jours programmer la relance par défaut.
 * `nextFollowUpDays: null` = pas de relance automatique.
 */
export const CALL_OUTCOME_RULES: Record<
  CallOutcome,
  { status: ProspectStatus; interest?: InterestLevel; nextFollowUpDays: number | null }
> = {
  pas_repondu: { status: "a_relancer", nextFollowUpDays: 2 },
  mauvais_numero: { status: "pas_interesse", nextFollowUpDays: null },
  a_rappeler: { status: "a_relancer", nextFollowUpDays: 3 },
  interesse: { status: "interesse", interest: "chaud", nextFollowUpDays: 2 },
  pas_interesse: { status: "pas_interesse", interest: "froid", nextFollowUpDays: null },
  rdv_pris: { status: "rdv_pris", interest: "chaud", nextFollowUpDays: 1 },
};

// ---------------------------------------------------------------------------
// Divers
// ---------------------------------------------------------------------------

export const USER_ROLES = ["associe", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  associe: "Associé",
  admin: "Admin",
};

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

export const ACTIVITY_TYPES = [
  "prospect_cree",
  "statut_change",
  "appel_effectue",
  "relance_programmee",
  "relance_reportee",
  "tache_creee",
  "tache_terminee",
  "responsable_change",
  "note_ajoutee",
  "import_csv",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  prospect_cree: "Prospect créé",
  statut_change: "Statut modifié",
  appel_effectue: "Appel effectué",
  relance_programmee: "Relance programmée",
  relance_reportee: "Relance reportée",
  tache_creee: "Tâche créée",
  tache_terminee: "Tâche terminée",
  responsable_change: "Responsable modifié",
  note_ajoutee: "Note ajoutée",
  import_csv: "Import CSV",
};
