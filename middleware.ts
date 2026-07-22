import { NextResponse, type NextRequest } from "next/server";

/**
 * Garde-fou de premier niveau : redirige vers /login si aucun cookie de session
 * n'est présent. La vérification cryptographique réelle du jeton, ainsi que
 * l'existence de l'utilisateur en base, sont faites côté serveur par
 * `getCurrentUser()` (dans le layout applicatif et dans /login).
 *
 * Volontairement, le middleware ne redirige PAS loin de /login sur la seule
 * présence du cookie : un cookie peut être présent mais périmé (utilisateur
 * supprimé, base réinitialisée en développement…), et faire confiance à sa
 * simple présence ici créerait une boucle de redirection avec la vérification
 * plus stricte faite plus bas dans l'arbre (page /login ↔ layout protégé).
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("crm_session");
  const { pathname } = request.nextUrl;

  if (!hasSession && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
