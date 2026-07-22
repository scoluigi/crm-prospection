/**
 * Peuple la base avec des données de démonstration réalistes :
 * - 3 associés (Arthur, Yassine, Luigi)
 * - 30 prospects, dont les 4 déjà présents dans le Google Sheet d'origine
 * - appels, relances, tâches et notes cohérents avec le statut de chaque prospect
 *
 * Idempotent : peut être relancé après `npm run db:reset` sans état résiduel.
 * Usage : npm run db:seed  (ou npm run setup pour push + seed en une fois)
 */
import "./load-env";
import { eq } from "drizzle-orm";
import { db, prospects, users, calls, reminders, tasks, notes as notesTable, activityLogs } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createProspect, type ProspectInput } from "@/services/prospects";
import { logCall } from "@/services/calls";
import { scheduleReminder } from "@/services/reminders";
import { createTask, type TaskInput } from "@/services/tasks";
import { addNote } from "@/services/notes";
import { addDaysISO, today, uid } from "@/lib/utils";
import type { CallOutcome, InterestLevel, ProspectStatus, TaskPriority, TaskType } from "@/lib/constants";

async function main() {
  console.log("Nettoyage des données existantes…");
  await db.delete(activityLogs);
  await db.delete(notesTable);
  await db.delete(reminders);
  await db.delete(calls);
  await db.delete(tasks);
  await db.delete(prospects);
  await db.delete(users);

  const seedPassword = process.env.SEED_PASSWORD ?? "crm2026";
  const passwordHash = await hashPassword(seedPassword);

  console.log("Création des 3 associés…");
  const team = [
    { id: uid(), name: "Arthur", email: "arthur@agence-web.fr", color: "#4f46e5" },
    { id: uid(), name: "Yassine", email: "yassine@agence-web.fr", color: "#059669" },
    // Email réel de l'utilisateur courant : connexion immédiate possible après le seed.
    { id: uid(), name: "Luigi", email: "sa2co.luigi@gmail.com", color: "#ea580c" },
  ];

  for (const [i, member] of team.entries()) {
    await db.insert(users).values({
      id: member.id,
      name: member.name,
      email: member.email,
      passwordHash,
      role: i === 0 ? "admin" : "associe",
      color: member.color,
      active: true,
      createdAt: Date.now(),
    });
  }
  const [arthur, yassine, luigi] = team;

  type Seed = {
    companyName: string;
    contactName?: string;
    phone?: string;
    email?: string;
    website?: string;
    sector: string;
    city: string;
    source: ProspectInput["source"];
    status: ProspectStatus;
    interest: InterestLevel;
    owner: typeof arthur;
    amount?: number;
    need: string;
    note?: string;
  };

  const S = { a: arthur, y: yassine, l: luigi };

  // Les 4 premières lignes reproduisent exactement le Google Sheet d'origine.
  const seedData: Seed[] = [
    {
      companyName: "BDS Piscine",
      contactName: "Bruno Sabatier",
      phone: "0387451122",
      sector: "Pisciniste",
      city: "Metz",
      source: "Cold call",
      status: "perdu",
      interest: "froid",
      owner: S.a,
      need: "Site vitrine avec galerie de réalisations",
      note: "A choisi un concurrent moins cher. Rester en contact pour l'année prochaine.",
    },
    {
      companyName: "Charlyne Chollet",
      contactName: "Charlyne Chollet",
      phone: "0687452233",
      email: "charlyne.chollet@gmail.com",
      sector: "Freelance Marketing",
      city: "Nancy",
      source: "Recommandation",
      status: "interesse",
      interest: "chaud",
      owner: S.a,
      amount: 900,
      need: "Portfolio + page de contact",
    },
    {
      companyName: "Maison Impérial",
      contactName: "Sofia Marchetti",
      phone: "0382551144",
      sector: "Évènementiel",
      city: "Thionville",
      source: "LinkedIn",
      status: "rdv_pris",
      interest: "chaud",
      owner: S.y,
      amount: 1800,
      need: "Site vitrine + module de réservation de salle",
    },
    {
      companyName: "Débarras Metz",
      contactName: "Kevin Antunes",
      phone: "0367891234",
      sector: "Débarras",
      city: "Metz",
      source: "Google Maps",
      status: "a_relancer",
      interest: "tiede",
      owner: S.l,
      amount: 700,
      need: "Site vitrine simple avec devis en ligne",
      note: "Veut réfléchir, rappeler en fin de semaine.",
    },
    // Prospects complémentaires
    { companyName: "Boulangerie Léa", contactName: "Léa Fontaine", phone: "0387123456", sector: "Boulangerie-pâtisserie", city: "Metz", source: "Google Maps", status: "a_contacter", interest: "inconnu", owner: S.l, need: "Site vitrine + horaires + galerie photos" },
    { companyName: "Garage Petitjean", contactName: "Michel Petitjean", phone: "0383221100", sector: "Garage automobile", city: "Nancy", source: "Google Maps", status: "a_contacter", interest: "inconnu", owner: S.a, need: "Site avec prise de rendez-vous en ligne" },
    { companyName: "Cabinet Dentaire Roussel", contactName: "Dr. Anne Roussel", phone: "0388221199", sector: "Dentiste", city: "Strasbourg", source: "Recommandation", status: "a_contacter", interest: "inconnu", owner: S.y, need: "Site + prise de RDV en ligne" },
    { companyName: "Atelier Vélo Nancy", contactName: "Julien Simon", phone: "0383445566", sector: "Réparation vélo", city: "Nancy", source: "Instagram", status: "a_contacter", interest: "inconnu", owner: S.a, need: "Site vitrine + boutique de pièces" },
    { companyName: "Coiffure Étincelle", contactName: "Nadia Belkacem", phone: "0382334455", sector: "Coiffeur", city: "Thionville", source: "Google Maps", status: "a_contacter", interest: "inconnu", owner: S.l, need: "Site avec prise de RDV en ligne" },
    { companyName: "Menuiserie Klein", contactName: "Thomas Klein", phone: "0387667788", sector: "Menuiserie", city: "Sarreguemines", source: "Recommandation", status: "a_contacter", interest: "inconnu", owner: S.y, need: "Site vitrine + portfolio de chantiers" },
    { companyName: "Fleurs de Lorraine", contactName: "Isabelle Weber", phone: "0387998877", sector: "Fleuriste", city: "Metz", source: "Google Maps", status: "appele", interest: "froid", owner: S.l, need: "Site vitrine + commande en ligne" },
    { companyName: "Cabinet Avocat Muller", contactName: "Me. Sarah Muller", phone: "0388776655", sector: "Avocat", city: "Strasbourg", source: "LinkedIn", status: "appele", interest: "tiede", owner: S.a, need: "Site institutionnel + formulaire de contact" },
    { companyName: "Kiné Plus Nancy", contactName: "Paul Girard", phone: "0383556677", sector: "Kinésithérapeute", city: "Nancy", source: "Google Maps", status: "appele", interest: "tiede", owner: S.y, need: "Site + prise de RDV Doctolib intégrée" },
    { companyName: "Électricité Weber", contactName: "Marc Weber", phone: "0329887766", sector: "Électricien", city: "Épinal", source: "Cold call", status: "appele", interest: "froid", owner: S.a, need: "Site vitrine + zone d'intervention" },
    { companyName: "Plomberie Grandjean", contactName: "Denis Grandjean", phone: "0387112233", sector: "Plombier", city: "Metz", source: "Cold call", status: "a_relancer", interest: "tiede", owner: S.y, amount: 650, need: "Site vitrine + devis en ligne", note: "Doit valider le budget avec son associé." },
    { companyName: "Auto-École du Centre", contactName: "Chantal Roy", phone: "0383223344", sector: "Auto-école", city: "Nancy", source: "Google Maps", status: "a_relancer", interest: "tiede", owner: S.a, amount: 800, need: "Site + planning des cours en ligne" },
    { companyName: "Traiteur Alsacien", contactName: "Éric Haas", phone: "0388443322", sector: "Traiteur", city: "Strasbourg", source: "Salon / événement", status: "a_relancer", interest: "chaud", owner: S.l, amount: 1200, need: "Site vitrine + galerie + devis événementiel", note: "Très motivé, attend juste la reprise après un mariage." },
    { companyName: "Paysages Vosgiens", contactName: "Fabrice Antoine", phone: "0329556644", sector: "Paysagiste", city: "Épinal", source: "Recommandation", status: "a_relancer", interest: "froid", owner: S.y, amount: 500, need: "Site vitrine simple" },
    { companyName: "Immo Est Conseil", contactName: "Karim Benali", phone: "0387998811", sector: "Agence immobilière", city: "Metz", source: "LinkedIn", status: "interesse", interest: "chaud", owner: S.a, amount: 2200, need: "Site avec listing de biens + recherche filtrée", note: "Souhaite un site avec intégration de son CRM immobilier." },
    { companyName: "Studio Photo Lorrain", contactName: "Camille Roth", phone: "0383667799", sector: "Photographe", city: "Nancy", source: "Instagram", status: "interesse", interest: "chaud", owner: S.y, amount: 950, need: "Portfolio + galerie + réservation de séance" },
    { companyName: "Cave à Vin du Marché", contactName: "Vincent Blanc", phone: "0388556633", sector: "Cave à vin", city: "Strasbourg", source: "Google Maps", status: "interesse", interest: "tiede", owner: S.l, amount: 1100, need: "Site vitrine + vente en ligne" },
    { companyName: "Optique Vision Plus", contactName: "Nathalie Perrin", phone: "0382667711", sector: "Opticien", city: "Thionville", source: "Recommandation", status: "rdv_pris", interest: "chaud", owner: S.a, amount: 1400, need: "Site + prise de RDV + catalogue montures" },
    { companyName: "Salle de Sport FitZone", contactName: "Steve Morin", phone: "0383778822", sector: "Salle de sport", city: "Nancy", source: "Cold call", status: "rdv_pris", interest: "chaud", owner: S.y, amount: 1600, need: "Site + espace membre + tarifs" },
    { companyName: "Architecture Moderne SARL", contactName: "Élise Fontaine", phone: "0388223311", sector: "Architecte", city: "Strasbourg", source: "LinkedIn", status: "devis_envoye", interest: "chaud", owner: S.l, amount: 2800, need: "Site portfolio haut de gamme", note: "Devis envoyé, relance prévue avant sa décision de fin de mois." },
    { companyName: "Boucherie Charcuterie Fischer", contactName: "Guy Fischer", phone: "0387554411", sector: "Boucherie", city: "Sarreguemines", source: "Google Maps", status: "devis_envoye", interest: "tiede", owner: S.a, amount: 600, need: "Site vitrine + spécialités de la semaine" },
    { companyName: "Cabinet Comptable Petit", contactName: "Sandrine Petit", phone: "0387667722", sector: "Expert-comptable", city: "Metz", source: "Recommandation", status: "devis_envoye", interest: "chaud", owner: S.y, amount: 1900, need: "Site institutionnel + espace client sécurisé" },
    { companyName: "Hôtel Le Verdunois", contactName: "Pierre Lacroix", phone: "0329112233", sector: "Hôtellerie", city: "Verdun", source: "Salon / événement", status: "gagne", interest: "chaud", owner: S.a, amount: 3200, need: "Site + moteur de réservation", note: "Contrat signé, site livré en cours de développement." },
    { companyName: "Restaurant La Table Est", contactName: "Marie Dubreuil", phone: "0326445588", sector: "Restaurant", city: "Reims", source: "Instagram", status: "gagne", interest: "chaud", owner: S.y, amount: 1500, need: "Site vitrine + menu + réservation", note: "Client très satisfait, a déjà recommandé un voisin restaurateur." },
    { companyName: "Serrurerie Rapide 57", contactName: "Ahmed Ziani", phone: "0387223399", sector: "Serrurier", city: "Metz", source: "Cold call", status: "pas_interesse", interest: "froid", owner: S.l, need: "Site vitrine + urgence 24/7" },
    { companyName: "Club de Tennis Nancy", contactName: "Olivier Marchand", phone: "0383998855", sector: "Club sportif", city: "Nancy", source: "Autre", status: "perdu", interest: "froid", owner: S.a, need: "Site + espace adhérents", note: "Budget alloué à autre chose cette saison." },
  ];

  console.log(`Création de ${seedData.length} prospects…`);
  const createdIds: { id: string; seed: Seed }[] = [];

  for (const seed of seedData) {
    const input: ProspectInput = {
      companyName: seed.companyName,
      contactName: seed.contactName,
      phone: seed.phone,
      email: seed.email,
      website: seed.website,
      sector: seed.sector,
      city: seed.city,
      source: seed.source,
      status: seed.status,
      interest: seed.interest,
      ownerId: seed.owner.id,
      estimatedAmount: seed.amount ?? null,
      identifiedNeed: seed.need,
      notes: seed.note ?? null,
    };
    const id = await createProspect(input, seed.owner.id);
    createdIds.push({ id, seed });
  }

  // ---------------------------------------------------------------------
  // Appels, relances et notes cohérents avec le statut de chaque prospect
  // ---------------------------------------------------------------------
  console.log("Génération des appels, relances et notes…");

  const OUTCOME_BY_STATUS: Partial<Record<ProspectStatus, CallOutcome>> = {
    appele: "pas_repondu",
    a_relancer: "a_rappeler",
    interesse: "interesse",
    rdv_pris: "rdv_pris",
    devis_envoye: "interesse",
    gagne: "rdv_pris",
    perdu: "pas_interesse",
    pas_interesse: "pas_interesse",
  };

  let dueOffset = -2; // Fait varier les relances : certaines en retard, d'autres à venir.

  for (const { id, seed } of createdIds) {
    const outcome = OUTCOME_BY_STATUS[seed.status];
    if (outcome) {
      await logCall({
        prospectId: id,
        userId: seed.owner.id,
        outcome,
        notes: seed.note ?? null,
      });
      // logCall applique ses propres règles métier (statut, intérêt, relance) en fonction
      // du résultat d'appel : c'est le comportement voulu en usage réel, mais pour le seed
      // on veut la distribution de statuts définie ci-dessus. On la restaure explicitement.
      await db
        .update(prospects)
        .set({ status: seed.status, interest: seed.interest })
        .where(eq(prospects.id, id));
    }

    if (seed.note && seed.status !== "a_contacter") {
      await addNote(id, seed.owner.id, seed.note);
    }

    // Relance active pour tout ce qui n'est pas figé (gagné/perdu/pas intéressé).
    if (!["gagne", "perdu", "pas_interesse"].includes(seed.status)) {
      const due = addDaysISO(dueOffset);
      await scheduleReminder({
        prospectId: id,
        assigneeId: seed.owner.id,
        dueDate: due,
        channel: "appel",
        note: seed.status === "a_contacter" ? "Premier appel de prospection" : null,
        actorId: seed.owner.id,
      });
      dueOffset += 1;
      if (dueOffset > 6) dueOffset = -3;
    } else {
      // Dossier clos : on annule la relance que logCall aurait pu programmer automatiquement.
      await db.update(reminders).set({ status: "cancelled" }).where(eq(reminders.prospectId, id));
      await db.update(prospects).set({ nextFollowUp: null }).where(eq(prospects.id, id));
    }
  }

  // ---------------------------------------------------------------------
  // Tâches : personnelles, communes, en retard, du jour, à venir
  // ---------------------------------------------------------------------
  console.log("Création des tâches…");

  const byCompany = (name: string) => createdIds.find((c) => c.seed.companyName === name)!.id;

  const taskSeeds: { input: TaskInput; owner: typeof arthur }[] = [
    { input: { title: "Rappeler Débarras Metz avant vendredi", type: "relance", priority: "haute", dueDate: today(), prospectId: byCompany("Débarras Metz") }, owner: luigi },
    { input: { title: "Préparer le devis pour Immo Est Conseil", type: "administratif", priority: "urgente", dueDate: today(), prospectId: byCompany("Immo Est Conseil") }, owner: arthur },
    { input: { title: "Confirmer le RDV avec Maison Impérial", type: "rendez_vous", priority: "haute", dueDate: today(), prospectId: byCompany("Maison Impérial") }, owner: yassine },
    { input: { title: "Relancer Architecture Moderne sur le devis", type: "relance", priority: "urgente", dueDate: addDaysISO(-2), prospectId: byCompany("Architecture Moderne SARL") }, owner: luigi },
    { input: { title: "Envoyer facture Hôtel Le Verdunois", type: "administratif", priority: "normale", dueDate: addDaysISO(-1), prospectId: byCompany("Hôtel Le Verdunois") }, owner: arthur },
    { input: { title: "Prospecter 15 artisans du secteur BTP à Metz", type: "cold_call", priority: "haute", dueDate: today() }, owner: luigi },
    { input: { title: "Prospecter les commerces du centre-ville de Nancy", type: "cold_call", priority: "normale", dueDate: today() }, owner: yassine },
    { input: { title: "Mettre à jour les tarifs sur les devis types", type: "administratif", priority: "basse", dueDate: addDaysISO(3) }, owner: arthur },
    { input: { title: "Préparer la relance groupée des prospects froids", type: "autre", priority: "normale", dueDate: addDaysISO(2) }, owner: arthur },
    { input: { title: "Répondre aux emails de la semaine", type: "email", priority: "normale", dueDate: today(), assigneeId: null }, owner: arthur },
    { input: { title: "Faire le point pipeline du vendredi", type: "autre", priority: "haute", dueDate: addDaysISO(1), assigneeId: null }, owner: arthur },
    { input: { title: "Mettre à jour le book de réalisations clients", type: "autre", priority: "basse", dueDate: addDaysISO(5), assigneeId: null }, owner: yassine },
  ];

  for (const t of taskSeeds) {
    await createTask(t.input, t.owner.id);
  }

  // Quelques tâches déjà terminées aujourd'hui, pour peupler les statistiques d'équipe.
  const doneToday: { input: TaskInput; owner: typeof arthur }[] = [
    { input: { title: "Appeler Fleurs de Lorraine", type: "cold_call", priority: "normale", dueDate: today() }, owner: luigi },
    { input: { title: "Mettre à jour la fiche Kiné Plus Nancy", type: "autre", priority: "basse", dueDate: today(), prospectId: byCompany("Kiné Plus Nancy") }, owner: yassine },
  ];
  for (const t of doneToday) {
    const id = await createTask(t.input, t.owner.id);
    await db.update(tasks).set({ status: "termine", completedAt: Date.now() }).where(eq(tasks.id, id));
  }

  console.log("\nSeed terminé !");
  console.log("Comptes créés (mot de passe : " + seedPassword + ") :");
  for (const m of team) console.log(`  - ${m.name} <${m.email}>`);
  console.log(`\n${createdIds.length} prospects, appels, relances, notes et tâches générés.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
