"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flashRedirect } from "@/lib/flash";

// Seuls ces messages (écrits par nous, en base) sont montrés tels quels ; le reste devient un message générique.
const SAFE = ["Une commande est déjà en cours pour ce pack", "Aucun paiement attendu pour le moment", "Pack introuvable", "Commande introuvable", "Une raison est obligatoire", "Transition interdite", "Document introuvable", "Un document validé ne peut pas être supprimé"];
const toMessage = (m: string) => SAFE.find((s) => m.includes(s)) ?? "Une erreur est survenue. Réessayez ou contactez-nous.";
const back = (path: string, e: string): never => flashRedirect(path, "erreur", e);

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
  if (!p.success) flashRedirect(base, "erreur", "Vérifiez les champs du projet (niveau, domaine, année 2026-2035).");
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_project", {
    p_student: target, p_country: p.data.country || null, p_level: p.data.level, p_domain: p.data.domain,
    p_year: p.data.year, p_goal: p.data.goal, p_budget: p.data.budget,
  });
  if (error) flashRedirect(base, "erreur", error.message.includes("Accès refusé") ? "Accès refusé" : "Impossible d'enregistrer le projet.");
  revalidatePath("/app", "layout");
  revalidatePath(base);
  flashRedirect(base, "ok", "Projet enregistré.");
}

// ───────── Documents : suppression (étudiant, documents non validés) ─────────
export async function deleteDocument(form: FormData) {
  await requireRole(["student"]);
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return back("/app/documents", "Document introuvable");
  // La base contrôle propriétaire + statut, journalise, supprime les lignes et renvoie les chemins à effacer.
  const { data: paths, error } = await (await createClient()).rpc("delete_document", { p_document: id.data });
  if (error) return back("/app/documents", toMessage(error.message));
  // Nettoyage du fichier (clé de service). Un échec laisse un fichier orphelin : journalisé, sans bloquer l'étudiant.
  try {
    const list = Array.isArray(paths) ? (paths as string[]) : [];
    if (list.length) {
      const { error: rmError } = await createAdminClient().storage.from("documents").remove(list);
      if (rmError) console.error("[documents] fichiers non supprimés du stockage :", list.length, rmError.message);
    }
  } catch (e) { console.error("[documents] nettoyage du stockage impossible :", e instanceof Error ? e.message : e); }
  revalidatePath("/app/documents");
  return flashRedirect("/app/documents", "ok", "Document supprimé.");
}

// ───────── Profil (nom et téléphone, via la fonction SQL validée update_my_profile) ─────────
const profileSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom complet.").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,18}$/, "Numéro de téléphone invalide (8 à 18 chiffres, « + » possible)."),
});

export async function updateProfile(form: FormData) {
  await requireRole(["student"]);
  const p = profileSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return flashRedirect("/app/profil", "erreur", p.error.issues[0].message);
  const { error } = await (await createClient()).rpc("update_my_profile", { p_name: p.data.name, p_phone: p.data.phone });
  if (error) return flashRedirect("/app/profil", "erreur", "Impossible d'enregistrer votre profil.");
  revalidatePath("/app", "layout");
  return flashRedirect("/app/profil", "ok", "Profil mis à jour.");
}
