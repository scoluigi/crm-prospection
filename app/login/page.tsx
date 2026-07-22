import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PhoneCall } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Le middleware ne fait que vérifier la présence du cookie ; ici on vérifie
  // vraiment la session (signature + utilisateur toujours actif en base)
  // avant de renvoyer un utilisateur déjà connecté vers l'application.
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <PhoneCall className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">CRM Prospection</h1>
            <p className="text-sm text-slate-500">Espace privé des associés</p>
          </div>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-slate-400">
          Accès libre — saisis ton email pour continuer.
        </p>
      </div>
    </main>
  );
}
