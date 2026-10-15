"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { getSessionProfile, homeFor, type Role } from "@/lib/auth/session";
import { newPasswordSchema, resetRequestSchema, safeNext, signInSchema, signUpSchema } from "@/lib/validators/auth";
import { allowAll, requestIpHash, TOO_MANY } from "@/lib/security/rate-limit";
import { hashKey } from "@/lib/security/keys";

export interface FormState { error?: string; fieldErrors?: Record<string, string>; message?: string }
const NOT_CONFIGURED = "Le service de connexion n'est pas encore configuré. Réessayez plus tard.";

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  // Deux compteurs : par IP (large) et par e-mail (strict) contre le bourrage d'identifiants.
  const ip = await requestIpHash();
  if (!(await allowAll([[`signin:ip:${ip}`, 20, 600], [`signin:email:${hashKey(parsed.data.email)}`, 5, 600]]))) return { error: TOO_MANY };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  // Message volontairement générique : ne révèle pas si l'e-mail existe.
  if (error || !data.user) return { error: "E-mail ou mot de passe incorrect." };

  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.user.id).single();
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Ce compte est désactivé. Contactez-nous." };
  }
  redirect(safeNext(form.get("next")) ?? homeFor(profile.role as Role));
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };

  const { fullName, phone, email, password } = parsed.data;
  if (!(await allowAll([[`signup:ip:${await requestIpHash()}`, 5, 3600]]))) return { error: TOO_MANY };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    // Le rôle n'est JAMAIS lu ici : le trigger SQL force « student ».
    options: { data: { full_name: fullName, phone }, emailRedirectTo: `${publicEnv.appUrl}/auth/callback?next=/app/dashboard` },
  });
  if (error) return { error: "Impossible de créer le compte avec ces informations." };
  const pack = String(form.get("pack") ?? "");
  if (data.session) redirect(/^[a-z0-9-]{1,60}$/.test(pack) ? `/app/commande?pack=${pack}` : "/app/dashboard");
  return { message: "Compte créé. Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous." };
}

export async function signOut() {
  if (isSupabaseConfigured) await (await createClient()).auth.signOut();
  redirect("/");
}

/** Réponse identique que le compte existe ou non (pas d'énumération de comptes). */
const RESET_SENT = "Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d'être envoyé. Pensez à vérifier vos courriers indésirables.";

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const ip = await requestIpHash();
  if (!(await allowAll([[`reset:ip:${ip}`, 5, 3600], [`reset:email:${hashKey(parsed.data.email)}`, 3, 3600]]))) return { error: TOO_MANY };
  // Les erreurs (compte inconnu, e-mail non envoyé) sont volontairement masquées à l'utilisateur.
  await (await createClient()).auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${publicEnv.appUrl}/auth/callback?next=/mot-de-passe/nouveau` });
  return { message: RESET_SENT };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const me = await getSessionProfile();
  if (!me) return { error: "Ce lien a expiré. Refaites une demande de réinitialisation." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Impossible de modifier le mot de passe. Choisissez un mot de passe plus robuste ou refaites une demande." };
  // Un mot de passe vient de changer (souvent après une compromission suspectée) : on ferme toutes les AUTRES sessions.
  await supabase.auth.signOut({ scope: "others" }).catch(() => undefined);
  redirect(homeFor(me.role));
}
