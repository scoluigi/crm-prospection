import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Identifiant unique côté serveur et client. */
export function uid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Dates — toutes les dates « métier » sont des chaînes ISO `YYYY-MM-DD`.
// On travaille en heure locale pour que « aujourd'hui » corresponde à la
// journée réellement vécue par les associés, pas à UTC.
// ---------------------------------------------------------------------------

export function toISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return toISODate();
}

export function addDaysISO(days: number, from: string = today()): string {
  const [y, m, d] = from.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Nombre de jours entre deux dates ISO (négatif si `date` est dans le passé). */
export function daysUntil(date: string, from: string = today()): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = date.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86_400_000);
}

/** Début de la journée courante en epoch ms (pour filtrer les appels du jour). */
export function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfDayMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATETIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** `2026-07-22` → `22 juil. 2026`. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return DATE_FMT.format(new Date(y, m - 1, d));
}

/** Epoch ms → `22 juil. 14:30`. */
export function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return "—";
  return DATETIME_FMT.format(new Date(ms));
}

/** Libellé relatif court : « Aujourd'hui », « Demain », « En retard de 3 j »… */
export function relativeDayLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = daysUntil(iso);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff === -1) return "Hier";
  if (diff < 0) return `Retard ${Math.abs(diff)} j`;
  if (diff <= 7) return `Dans ${diff} j`;
  return formatDate(iso);
}

/** Niveau d'urgence d'une échéance, utilisé pour colorer les badges. */
export type Urgency = "overdue" | "today" | "soon" | "later" | "none";

export function urgencyOf(iso: string | null | undefined): Urgency {
  if (!iso) return "none";
  const diff = daysUntil(iso);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 3) return "soon";
  return "later";
}

export const URGENCY_COLORS: Record<Urgency, string> = {
  overdue: "bg-rose-100 text-rose-700 border-rose-200",
  today: "bg-amber-100 text-amber-800 border-amber-200",
  soon: "bg-sky-100 text-sky-700 border-sky-200",
  later: "bg-neutral-100 text-neutral-600 border-neutral-200",
  none: "bg-neutral-100 text-neutral-400 border-neutral-200",
};

// ---------------------------------------------------------------------------
// Formatage & normalisation
// ---------------------------------------------------------------------------

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEuro(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return EUR.format(amount);
}

/** Retire accents, espaces et casse pour comparer deux libellés. */
export function normalize(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Ne garde que les chiffres d'un numéro, en supprimant l'indicatif français. */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33") && digits.length >= 11) return `0${digits.slice(2)}`;
  return digits;
}

/**
 * Clé de déduplication d'un prospect.
 * On privilégie le téléphone (fiable) et on retombe sur le nom d'entreprise.
 */
export function buildDedupeKey(companyName: string, phone?: string | null): string {
  const p = normalizePhone(phone);
  return p ? `tel:${p}` : `nom:${normalize(companyName)}`;
}

/** `Débarras Metz` → `DM`. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Ajoute `https://` si le protocole manque, pour que les liens fonctionnent. */
export function ensureHttp(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Convertit une saisie libre (« 1 500 € », « 1500,50 ») en nombre. */
export function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
