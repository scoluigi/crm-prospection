import {
  BookOpen,
  CalendarClock,
  PhoneCall,
  Timer,
  Trophy,
  UserPlus,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    icon: UserPlus,
    title: "1. Ajoute tes leads",
    body: "Clique sur « Nouveau lead » en haut à droite. L'essentiel suffit : entreprise, téléphone, où tu as eu le lead (la source), et le responsable. Tu peux compléter plus tard.",
  },
  {
    icon: CalendarClock,
    title: "2. Planifie 3 relances",
    body: "Sur chaque lead tu peux fixer une 1re, 2e et 3e date de relance. La prochaine à venir est mise en avant dans la liste : rouge si en retard, orange si c'est aujourd'hui.",
  },
  {
    icon: PhoneCall,
    title: "3. Suis tes appels",
    body: "Ouvre une fiche lead pour enregistrer un appel et son résultat (intéressé, à rappeler…). Le statut du lead se met à jour tout seul, et l'historique se garde.",
  },
  {
    icon: Timer,
    title: "4. Pointe tes sessions",
    body: "En arrivant, la pointeuse te salue et démarre le chrono. Quand tu as fini (ou que tu quittes la page), une popup te demande combien d'appels tu as passés. Tu peux aussi pointer à tout moment avec le bouton « Pointer ».",
  },
  {
    icon: Trophy,
    title: "5. Grimpe au classement",
    body: "Tes appels déclarés alimentent le classement de l'équipe (aujourd'hui / 7 jours). Un peu de concurrence saine pour se motiver — vise la 1re place 🥇.",
  },
];

export default async function GuidePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <BookOpen className="size-5 text-indigo-500" />
          Bienvenue {user.name} 👋
        </h1>
        <p className="text-sm text-slate-500">Le CRM en 5 étapes. Ça se lit en une minute.</p>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <s.icon className="size-4" />
                </span>
                {s.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-600">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
        <p className="font-medium">En résumé</p>
        <p className="mt-1 text-indigo-800/90">
          Ajoute un lead → planifie tes relances → appelle → pointe ta session → compare-toi à
          l&apos;équipe. C&apos;est tout.
        </p>
      </div>
    </div>
  );
}
