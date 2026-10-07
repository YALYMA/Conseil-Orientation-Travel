"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { homeFor, type Role } from "@/lib/auth/session";
import { safeNext, signInSchema, signUpSchema } from "@/lib/validators/auth";
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
    options: { data: { full_name: fullName, phone }, emailRedirectTo: `${publicEnv.appUrl}/app/dashboard` },
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
