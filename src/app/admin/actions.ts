"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const SAFE = ["Numéro de téléphone invalide", "Le lien doit commencer par https://", "propre rôle", "Conseiller invalide", "Utilisateur introuvable", "Étudiant introuvable", "Rôle invalide"];
const msg = (m: string) => SAFE.find((s) => m.includes(s)) ?? "Une erreur est survenue.";
const go = (path: string, key: "ok" | "erreur", text: string): never => redirect(`${path}?${key}=${encodeURIComponent(text)}`);

const phone = z.string().trim().max(18).regex(/^(\+?[0-9 ]{8,18})?$/, "Numéro de téléphone invalide");
const url = z.string().trim().max(300).regex(/^(https:\/\/\S+)?$/, "Le lien doit commencer par https://");

export async function saveSettings(form: FormData) {
  await requireRole(["admin"]);
  const parsed = z.object({
    wave_name: z.string().trim().max(80), wave_phone: phone, wave_url: url, wave_instructions: z.string().trim().max(400),
    wa_phone: phone, wa_url: url,
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return go("/admin/reglages", "erreur", parsed.error.issues[0].message);
  const d = parsed.data;
  const supabase = await createClient();
  const a = await supabase.rpc("admin_update_setting", { p_key: "wave", p_value: { display_name: d.wave_name, phone: d.wave_phone, payment_url: d.wave_url, instructions: d.wave_instructions } });
  const b = await supabase.rpc("admin_update_setting", { p_key: "whatsapp", p_value: { phone: d.wa_phone, business_url: d.wa_url } });
  const err = a.error ?? b.error;
  if (err) return go("/admin/reglages", "erreur", msg(err.message));
  revalidatePath("/", "layout");
  return go("/admin/reglages", "ok", "Réglages enregistrés.");
}

export async function setRole(form: FormData) {
  await requireRole(["admin"]);
  const p = z.object({ user: z.string().uuid(), role: z.enum(["student", "advisor", "admin"]) }).safeParse(Object.fromEntries(form));
  if (!p.success) return go("/admin/utilisateurs", "erreur", "Demande invalide.");
  const { error } = await (await createClient()).rpc("admin_set_role", { p_user: p.data.user, p_role: p.data.role });
  if (error) return go("/admin/utilisateurs", "erreur", msg(error.message));
  revalidatePath("/admin", "layout");
  return go("/admin/utilisateurs", "ok", "Rôle mis à jour.");
}

export async function assignAdvisor(form: FormData) {
  await requireRole(["admin"]);
  const p = z.object({ student: z.string().uuid(), advisor: z.string().uuid().or(z.literal("")) }).safeParse(Object.fromEntries(form));
  if (!p.success) return go("/admin/utilisateurs", "erreur", "Demande invalide.");
  const { error } = await (await createClient()).rpc("admin_assign_advisor", { p_student: p.data.student, p_advisor: p.data.advisor || null });
  if (error) return go("/admin/utilisateurs", "erreur", msg(error.message));
  revalidatePath("/admin", "layout");
  return go("/admin/utilisateurs", "ok", "Conseiller assigné.");
}
