import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/public/AuthForms";
import { getSessionProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { flashRedirect } from "@/lib/flash";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function Page() {
  if (!isSupabaseConfigured) redirect("/connexion");
  // Cette page n'a de sens qu'avec une session (ouverte par le lien reçu par e-mail, ou par un utilisateur déjà connecté).
  if (!(await getSessionProfile())) flashRedirect("/connexion", "erreur", "Ce lien n'est plus valide. Demandez-en un nouveau.");
  return (<><h1 className="font-display mb-6 text-2xl font-extrabold">Choisir un nouveau mot de passe</h1><NewPasswordForm /></>);
}
