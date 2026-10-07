"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseFeatures, parseLines, parseLinks } from "@/lib/admin/parse";

const SAFE = ["Identifiant (slug) invalide", "Nom obligatoire", "Prix invalide", "Pack introuvable", "Nombre de candidatures invalide", "Lien officiel invalide", "Pays introuvable", "Procédure introuvable", "Titre obligatoire", "Question et réponse obligatoires", "Question introuvable", "Fonctionnalités invalides"];
const explain = (e: { message: string; code?: string }) => (e.code === "23505" ? "Cet identifiant existe déjà." : SAFE.find((s) => e.message.includes(s)) ?? "Une erreur est survenue.");
const go = (path: string, k: "ok" | "erreur", t: string): never => redirect(`${path}?${k}=${encodeURIComponent(t)}`);
const refresh = () => revalidatePath("/", "layout"); // pages publiques mises en cache : on les régénère

const slug = z.string().trim().regex(/^[a-z0-9-]{2,60}$/, "Identifiant invalide : minuscules, chiffres et tirets (2 à 60).");
const optId = z.string().uuid().or(z.literal("")).transform((v) => v || null);
const sort = z.coerce.number().int().min(0).max(1000).catch(0);
const flag = (f: FormData, k: string) => f.get(k) === "on";

export async function savePack(form: FormData) {
  await requireRole(["admin"]);
  const p = z.object({
    id: optId, slug, name: z.string().trim().min(1).max(80), tagline: z.string().trim().max(160), description: z.string().trim().max(1000),
    price: z.coerce.number().int().min(1).max(10_000_000), badge: z.string().trim().max(40), duration: z.string().trim().max(60),
    apps: z.string().trim().regex(/^\d{0,3}$/), deliverables: z.string().max(4000), excluded: z.string().max(4000), features: z.string().max(8000), sort,
  }).safeParse(Object.fromEntries(form));
  if (!p.success) return go("/admin/packs", "erreur", p.error.issues[0].message.startsWith("Identifiant") ? p.error.issues[0].message : "Vérifiez les champs du pack (nom, prix entier en FCFA).");
  const d = p.data;
  const { error } = await (await createClient()).rpc("admin_save_pack", {
    p_id: d.id, p_slug: d.slug, p_name: d.name, p_tagline: d.tagline, p_description: d.description, p_price: d.price, p_badge: d.badge, p_duration: d.duration,
    p_apps: d.apps === "" ? null : Number(d.apps), p_deliverables: parseLines(d.deliverables), p_excluded: parseLines(d.excluded), p_features: parseFeatures(d.features),
    p_active: flag(form, "active"), p_sort: d.sort,
  });
  if (error) return go("/admin/packs", "erreur", explain(error));
  refresh();
  return go("/admin/packs", "ok", d.id ? "Pack enregistré. Les commandes existantes gardent leur prix." : "Pack créé.");
}

export async function saveCountry(form: FormData) {
  await requireRole(["admin"]);
  const p = z.object({
    id: optId, slug, name: z.string().trim().min(1).max(80), flag: z.string().trim().max(8), summary: z.string().trim().max(300), description: z.string().trim().max(4000),
    types: z.string().max(2000), budget: z.string().trim().max(4000), visa: z.string().trim().max(4000), housing: z.string().trim().max(4000), links: z.string().max(3000), sort,
  }).safeParse(Object.fromEntries(form));
  if (!p.success) return go("/admin/pays", "erreur", "Vérifiez les champs du pays (nom, identifiant).");
  const links = parseLinks(p.data.links);
  if (!links.ok) return go("/admin/pays", "erreur", links.error);
  const d = p.data;
  const { error } = await (await createClient()).rpc("admin_save_country", {
    p_id: d.id, p_slug: d.slug, p_name: d.name, p_flag: d.flag, p_summary: d.summary, p_description: d.description, p_types: parseLines(d.types, 15),
    p_budget: d.budget, p_visa: d.visa, p_housing: d.housing, p_links: links.links, p_published: flag(form, "published"), p_sort: d.sort,
  });
  if (error) return go("/admin/pays", "erreur", explain(error));
  refresh();
  return go("/admin/pays", "ok", "Pays enregistré.");
}

export async function saveProcedure(form: FormData) {
  await requireRole(["admin"]);
  const p = z.object({
    id: optId, country: z.string().uuid(), title: z.string().trim().min(1).max(160), body: z.string().trim().max(6000), docs: z.string().max(3000),
    url: z.string().trim().max(300), verified: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/), sort,
  }).safeParse(Object.fromEntries(form));
  if (!p.success) return go("/admin/pays", "erreur", "Vérifiez les champs de la procédure (titre, date).");
  const d = p.data;
  const { error } = await (await createClient()).rpc("admin_save_procedure", {
    p_id: d.id, p_country: d.country, p_title: d.title, p_body: d.body, p_docs: parseLines(d.docs, 30), p_url: d.url, p_verified: d.verified || null, p_sort: d.sort,
  });
  if (error) return go("/admin/pays", "erreur", explain(error));
  refresh();
  return go("/admin/pays", "ok", "Procédure enregistrée.");
}

export async function deleteProcedure(form: FormData) {
  await requireRole(["admin"]);
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return go("/admin/pays", "erreur", "Demande invalide.");
  const { error } = await (await createClient()).rpc("admin_delete_procedure", { p_id: id.data });
  if (error) return go("/admin/pays", "erreur", explain(error));
  refresh();
  return go("/admin/pays", "ok", "Procédure supprimée.");
}

export async function saveFaq(form: FormData) {
  await requireRole(["admin"]);
  const p = z.object({ id: optId, question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(3000), sort }).safeParse(Object.fromEntries(form));
  if (!p.success) return go("/admin/faq", "erreur", "Question et réponse obligatoires.");
  const { error } = await (await createClient()).rpc("admin_save_faq", { p_id: p.data.id, p_question: p.data.question, p_answer: p.data.answer, p_sort: p.data.sort, p_published: flag(form, "published") });
  if (error) return go("/admin/faq", "erreur", explain(error));
  refresh();
  return go("/admin/faq", "ok", "Question enregistrée.");
}

export async function deleteFaq(form: FormData) {
  await requireRole(["admin"]);
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return go("/admin/faq", "erreur", "Demande invalide.");
  const { error } = await (await createClient()).rpc("admin_delete_faq", { p_id: id.data });
  if (error) return go("/admin/faq", "erreur", explain(error));
  refresh();
  return go("/admin/faq", "ok", "Question supprimée.");
}
