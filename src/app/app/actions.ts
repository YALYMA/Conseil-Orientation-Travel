"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Seuls ces messages (écrits par nous, en base) sont montrés tels quels ; le reste devient un message générique.
const SAFE = ["Une commande est déjà en cours pour ce pack", "Aucun paiement attendu pour le moment", "Pack introuvable", "Commande introuvable", "Une raison est obligatoire", "Transition interdite"];
const toMessage = (m: string) => SAFE.find((s) => m.includes(s)) ?? "Une erreur est survenue. Réessayez ou contactez-nous.";
const back = (path: string, e: string) => redirect(`${path}?erreur=${encodeURIComponent(e)}`);

export async function placeOrder(form: FormData) {
  await requireRole(["student"]);
  const slug = z.string().regex(/^[a-z0-9-]{1,60}$/).safeParse(form.get("slug"));
  if (!slug.success) back("/app/commande", "Pack introuvable");
  const supabase = await createClient();
  // AUCUN montant n'est transmis : le prix est lu et le 50/50 calculé en base.
  const { error } = await supabase.rpc("create_order", { p_pack_slug: slug.data!, p_country_id: null });
  if (error) back("/app/commande", toMessage(error.message));
  revalidatePath("/app", "layout");
  redirect("/app/paiements");
}

const orderId = z.string().uuid();

export async function declareProof(form: FormData) {
  await requireRole(["student"]);
  const id = orderId.safeParse(form.get("orderId"));
  const ref = z.string().trim().max(64).safeParse(form.get("waveRef") ?? "");
  if (!id.success || !ref.success) back("/app/paiements", "Commande introuvable");
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_payment_proof", { p_order: id.data!, p_wave_ref: ref.data || null, p_note: null });
  if (error) back("/app/paiements", toMessage(error.message));
  revalidatePath("/app", "layout");
  redirect("/app/paiements");
}

export async function cancelOrder(form: FormData) {
  await requireRole(["student"]);
  const id = orderId.safeParse(form.get("orderId"));
  const reason = z.string().trim().min(3).max(300).safeParse(form.get("reason"));
  if (!id.success) back("/app/paiements", "Commande introuvable");
  if (!reason.success) back("/app/paiements", "Une raison est obligatoire");
  const supabase = await createClient();
  const { error } = await supabase.rpc("student_cancel_order", { p_order: id.data!, p_reason: reason.data! });
  if (error) back("/app/paiements", toMessage(error.message));
  revalidatePath("/app", "layout");
  redirect("/app/paiements");
}

// ───────── Projet (étudiant, ou conseiller/admin depuis la fiche dossier) ─────────
const projectSchema = z.object({
  country: z.string().uuid().or(z.literal("")),
  level: z.string().regex(/^[a-z]{2,20}$/),
  domain: z.string().regex(/^[a-z]{2,20}$/),
  year: z.coerce.number().int().min(2026).max(2035),
  goal: z.string().trim().max(500),
  budget: z.string().trim().max(80),
});

export async function saveProject(form: FormData) {
  const me = await requireRole(["student", "advisor", "admin"]);
  const isStudent = me.role === "student";
  const target = isStudent ? me.id : String(form.get("studentId"));
  const base = isStudent ? "/app/projet" : `/advisor/etudiants/${target}`;
  if (!z.string().uuid().safeParse(target).success) redirect(isStudent ? "/app/projet" : "/advisor/etudiants");
  const p = projectSchema.safeParse(Object.fromEntries(form));
  if (!p.success) redirect(`${base}?erreur=${encodeURIComponent("Vérifiez les champs du projet (niveau, domaine, année 2026-2035).")}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_project", {
    p_student: target, p_country: p.data.country || null, p_level: p.data.level, p_domain: p.data.domain,
    p_year: p.data.year, p_goal: p.data.goal, p_budget: p.data.budget,
  });
  if (error) redirect(`${base}?erreur=${encodeURIComponent(error.message.includes("Accès refusé") ? "Accès refusé" : "Impossible d'enregistrer le projet.")}`);
  revalidatePath("/app", "layout");
  revalidatePath(base);
  redirect(`${base}?ok=${encodeURIComponent("Projet enregistré.")}`);
}
