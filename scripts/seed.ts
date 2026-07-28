/**
 * Données de démo pour le CRM simplifié :
 * - 3 associés
 * - 30 leads avec dates de relance
 * - appels du jour / de la semaine (pour alimenter le classement)
 * - une session de prospection en cours
 *
 * Usage : npm run db:seed
 */
import "./load-env";
import { db, prospects, users, calls, sessions, activityLogs } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { computeNextFollowUp } from "@/services/prospects";
import { addDaysISO, buildDedupeKey, uid } from "@/lib/utils";
import type { ProspectStatus } from "@/lib/constants";

const rand = (n: number) => Math.floor(Math.random() * n);

async function main() {
  console.log("Nettoyage…");
  await db.delete(activityLogs);
  await db.delete(sessions);
  await db.delete(calls);
  await db.delete(prospects);
  await db.delete(users);

  const seedPassword = process.env.SEED_PASSWORD ?? "crm2026";
  const passwordHash = await hashPassword(seedPassword);

  console.log("Associés…");
  const team = [
    { id: uid(), name: "Arthur", email: "arthur@agence-web.fr", color: "#4f46e5" },
    { id: uid(), name: "Yassine", email: "yassine@agence-web.fr", color: "#059669" },
    { id: uid(), name: "Luigi", email: "sa2co.luigi@gmail.com", color: "#ea580c" },
  ];
  for (const [i, m] of team.entries()) {
    await db.insert(users).values({
      id: m.id,
      name: m.name,
      email: m.email,
      passwordHash,
      role: i === 0 ? "admin" : "associe",
      color: m.color,
      active: true,
      createdAt: Date.now(),
    });
  }
  const [arthur, yassine, luigi] = team;

  // [entreprise, contact, téléphone, source, statut, owner, note?]
  type Row = [string, string, string, string, ProspectStatus, (typeof team)[number], string?];
  const rows: Row[] = [
    ["BDS Piscine", "Bruno Sabatier", "0387451122", "Cold call", "perdu", arthur, "Parti chez un concurrent."],
    ["Charlyne Chollet", "Charlyne Chollet", "0687452233", "Recommandation", "interesse", arthur, "Veut un portfolio."],
    ["Maison Impérial", "Sofia Marchetti", "0382551144", "LinkedIn", "rdv", yassine],
    ["Débarras Metz", "Kevin Antunes", "0367891234", "Google Maps", "a_relancer", luigi, "Rappeler en fin de semaine."],
    ["Boulangerie Léa", "Léa Fontaine", "0387123456", "Google Maps", "a_contacter", luigi],
    ["Garage Petitjean", "Michel Petitjean", "0383221100", "Google Maps", "a_contacter", arthur],
    ["Cabinet Dentaire Roussel", "Dr. Anne Roussel", "0388221199", "Recommandation", "a_contacter", yassine],
    ["Atelier Vélo Nancy", "Julien Simon", "0383445566", "Instagram", "a_contacter", arthur],
    ["Coiffure Étincelle", "Nadia Belkacem", "0382334455", "Google Maps", "a_contacter", luigi],
    ["Menuiserie Klein", "Thomas Klein", "0387667788", "Recommandation", "a_contacter", yassine],
    ["Fleurs de Lorraine", "Isabelle Weber", "0387998877", "Google Maps", "a_relancer", luigi],
    ["Cabinet Avocat Muller", "Me. Sarah Muller", "0388776655", "LinkedIn", "a_relancer", arthur],
    ["Kiné Plus Nancy", "Paul Girard", "0383556677", "Google Maps", "a_relancer", yassine],
    ["Électricité Weber", "Marc Weber", "0329887766", "Cold call", "a_relancer", arthur],
    ["Plomberie Grandjean", "Denis Grandjean", "0387112233", "Cold call", "a_relancer", yassine, "Valide le budget avec son associé."],
    ["Auto-École du Centre", "Chantal Roy", "0383223344", "Google Maps", "a_relancer", arthur],
    ["Traiteur Alsacien", "Éric Haas", "0388443322", "Salon / événement", "interesse", luigi, "Très motivé."],
    ["Paysages Vosgiens", "Fabrice Antoine", "0329556644", "Recommandation", "a_relancer", yassine],
    ["Immo Est Conseil", "Karim Benali", "0387998811", "LinkedIn", "interesse", arthur, "Veut intégrer son CRM."],
    ["Studio Photo Lorrain", "Camille Roth", "0383667799", "Instagram", "interesse", yassine],
    ["Cave à Vin du Marché", "Vincent Blanc", "0388556633", "Google Maps", "interesse", luigi],
    ["Optique Vision Plus", "Nathalie Perrin", "0382667711", "Recommandation", "rdv", arthur],
    ["Salle de Sport FitZone", "Steve Morin", "0383778822", "Cold call", "rdv", yassine],
    ["Architecture Moderne SARL", "Élise Fontaine", "0388223311", "LinkedIn", "interesse", luigi, "Devis envoyé."],
    ["Boucherie Fischer", "Guy Fischer", "0387554411", "Google Maps", "interesse", arthur],
    ["Cabinet Comptable Petit", "Sandrine Petit", "0387667722", "Recommandation", "interesse", yassine],
    ["Hôtel Le Verdunois", "Pierre Lacroix", "0329112233", "Salon / événement", "gagne", arthur, "Contrat signé."],
    ["Restaurant La Table Est", "Marie Dubreuil", "0326445588", "Instagram", "gagne", yassine, "Client satisfait."],
    ["Serrurerie Rapide 57", "Ahmed Ziani", "0387223399", "Cold call", "perdu", luigi],
    ["Club de Tennis Nancy", "Olivier Marchand", "0383998855", "Autre", "perdu", arthur, "Budget ailleurs cette saison."],
  ];

  console.log(`${rows.length} leads…`);
  const created: { id: string; owner: (typeof team)[number]; status: ProspectStatus }[] = [];
  const now = Date.now();

  for (const [company, contact, phone, source, status, owner, note] of rows) {
    const active = ["a_contacter", "a_relancer", "interesse", "rdv"].includes(status);
    let r1: string | null = null;
    let r2: string | null = null;
    let r3: string | null = null;
    if (active) {
      r1 = addDaysISO(rand(9) - 3); // entre -3 et +5 jours
      if (status !== "a_contacter") r2 = addDaysISO(rand(6) + 4);
      if (status === "interesse" || status === "rdv") r3 = addDaysISO(rand(6) + 10);
    }

    const id = uid();
    await db.insert(prospects).values({
      id,
      companyName: company,
      contactName: contact,
      phone,
      source,
      status,
      ownerId: owner.id,
      lastContactAt: status === "a_contacter" ? null : now - rand(6) * 86_400_000,
      relance1: r1,
      relance2: r2,
      relance3: r3,
      nextFollowUp: computeNextFollowUp(r1, r2, r3),
      notes: note ?? null,
      dedupeKey: buildDedupeKey(company, phone),
      createdAt: now,
      updatedAt: now,
    });
    created.push({ id, owner, status });
  }

  // Appels de la semaine (hors aujourd'hui) — historique par lead contacté.
  console.log("Appels…");
  for (const c of created) {
    if (c.status === "a_contacter") continue;
    const n = 1 + rand(2);
    for (let i = 0; i < n; i++) {
      await db.insert(calls).values({
        id: uid(),
        userId: c.owner.id,
        prospectId: c.id,
        outcome: null,
        notes: null,
        calledAt: now - (1 + rand(6)) * 86_400_000 - rand(8) * 3_600_000,
      });
    }
  }

  // Sessions pointées du jour, pour animer le classement.
  console.log("Sessions…");
  const startToday = new Date();
  startToday.setHours(9, 0, 0, 0);
  const todaySessions: { user: (typeof team)[number]; blocs: number[] }[] = [
    { user: arthur, blocs: [5, 4] }, // 9 appels
    { user: yassine, blocs: [6] }, // 6 appels
    { user: luigi, blocs: [8, 5] }, // 13 appels
  ];
  let cursor = startToday.getTime();
  for (const { user, blocs } of todaySessions) {
    let t = cursor;
    for (const nb of blocs) {
      const dur = (20 + rand(30)) * 60_000;
      await db.insert(sessions).values({
        id: uid(),
        userId: user.id,
        startedAt: t,
        endedAt: t + dur,
        callsCount: nb,
      });
      t += dur + 10 * 60_000;
    }
    cursor += 15 * 60_000;
  }

  // Une session de prospection en cours (Luigi « en ligne »).
  await db.insert(sessions).values({
    id: uid(),
    userId: luigi.id,
    startedAt: now - 22 * 60_000,
    endedAt: null,
    callsCount: null,
  });

  console.log("\nSeed terminé.");
  console.log(`Mot de passe : ${seedPassword}`);
  for (const m of team) console.log(`  - ${m.name} <${m.email}>`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
