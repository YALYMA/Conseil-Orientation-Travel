import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { safeNext } from "@/lib/validators/auth";
import { flashRedirect } from "@/lib/flash";

/** Retour des liens e-mail Supabase (confirmation d'inscription, réinitialisation) : échange le code contre une session. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next")) ?? "/app/dashboard";
  if (!isSupabaseConfigured || !code || code.length > 512) return flashRedirect("/connexion", "erreur", "Ce lien n'est plus valide. Demandez-en un nouveau.");
  const { error } = await (await createClient()).auth.exchangeCodeForSession(code);
  // Cas fréquent : lien ouvert sur un autre appareil que celui de l'inscription (le code de vérification est lié au navigateur).
  // L'adresse e-mail est alors déjà confirmée : on invite à se connecter plutôt que de laisser croire à un échec.
  if (error) return flashRedirect("/connexion", "erreur", "Impossible d'ouvrir la session depuis ce lien. Si vous venez de confirmer votre e-mail, connectez-vous avec votre mot de passe ; sinon, demandez un nouveau lien.");
  return NextResponse.redirect(new URL(next, publicEnv.appUrl)); // `next` est un chemin interne validé par safeNext
}
