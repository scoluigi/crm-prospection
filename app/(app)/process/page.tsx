import { Rocket, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyPrompt } from "@/components/process/copy-prompt";

const SITE_PROMPT = `Rédige un prompt optimisé conversion et « wow effect » directement chez le visiteur dès l'arrivée sur le site. J'ai besoin d'une refonte complète de …, responsive, sans IA blob.

- Je veux une image/vidéo (que tu trouveras dans le dossier annexe associé au projet, ou que tu généreras en fonction de l'activité du projet) en fond sur le header, avec le titre sur la gauche et le CTA soit en bas, soit à gauche.
- J'ai besoin d'animations de scroll et d'apparition.
- Il faut également une architecture visuelle cohérente avec les sites du même domaine d'activité.`;

const STEPS = [
  {
    title: "1. Récupère le brief & les assets",
    body: "Note l'activité du client, ses couleurs, et rassemble ses photos/vidéos dans le dossier annexe du projet. S'il n'y a rien d'exploitable, on générera les visuels.",
  },
  {
    title: "2. Ouvre Claude dans Chrome",
    body: "Lance Claude in Chrome sur la page de référence (le site actuel du client ou un site inspirant de son domaine).",
  },
  {
    title: "3. Colle le prompt ci-dessous",
    body: "Remplace « … » par l'activité du client (ex : « un site de pisciniste à Metz »). Ajoute le lien du dossier annexe si tu en as un.",
  },
  {
    title: "4. Itère sur le header",
    body: "Vérifie le wow-effect dès l'arrivée : image/vidéo en fond, titre à gauche, CTA visible. Demande des ajustements jusqu'à ce que ce soit net.",
  },
  {
    title: "5. Scroll, animations & responsive",
    body: "Ajoute les animations d'apparition au scroll, puis teste en mobile / tablette / desktop. Rien ne doit déborder, tout doit rester lisible.",
  },
  {
    title: "6. Cohérence & livraison",
    body: "Aligne l'architecture visuelle sur les standards du domaine, relis les textes, puis livre / déploie. Note le lien final sur la fiche du lead.",
  },
];

export default async function ProcessPage() {
  await requireUser();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Rocket className="size-5 text-indigo-500" />
          Process — créer un site client
        </h1>
        <p className="text-sm text-slate-500">La méthode maison, du brief à la livraison.</p>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-600">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            Le prompt Claude in Chrome
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-slate-500">
            Copie-le, remplace « … » par l&apos;activité du client, puis colle-le dans Claude in
            Chrome.
          </p>
          <CopyPrompt text={SITE_PROMPT} />
        </CardContent>
      </Card>
    </div>
  );
}
