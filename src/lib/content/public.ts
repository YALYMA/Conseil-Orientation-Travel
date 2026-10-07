import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { COUNTRIES, FAQS, PACKS, type PackView } from "./defaults";
import { mapCountry, mapPack, type CountryRow, type CountryView, type PackRow } from "./map";

/** Message d'erreur actionnable (visible dans les logs de build Vercel). Ne contient jamais de clé. */
function unavailable(what: string, error: { message: string }): Error {
  return new Error(
    `Lecture impossible : ${what} (Supabase : « ${error.message.slice(0, 160)} »). ` +
    "Vérifiez que supabase/setup.sql puis supabase/seed.sql ont été exécutés, que NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY sont corrects et que le projet Supabase n'est pas en pause.",
  );
}

/**
 * Sans Supabase configuré (dev) : contenu de repli. AVEC Supabase : la base fait foi.
 * En cas d'erreur on lève : Next.js conserve alors la dernière version mise en cache plutôt que d'afficher
 * des prix de repli potentiellement périmés.
 */
export async function getPacks(): Promise<PackView[]> {
  if (!isSupabaseConfigured) return PACKS;
  const { data, error } = await createPublicClient().from("service_packs")
    .select("slug, name, tagline, price_total, badge, indicative_duration, included_applications, excluded_services, pack_features(label, sort_order)")
    .eq("is_active", true).order("sort_order");
  if (error) throw unavailable("les packs", error);
  return (data as unknown as PackRow[]).map(mapPack);
}

export async function getPack(slug: string): Promise<PackView | null> {
  return (await getPacks()).find((p) => p.slug === slug) ?? null;
}

const fallbackCountry = (c: (typeof COUNTRIES)[number]): CountryView => ({ ...c, description: "", institutionTypes: [], budget: "", visa: "", housing: "", links: [], procedures: [] });

export async function getCountries(): Promise<{ slug: string; name: string; flag: string; summary: string }[]> {
  if (!isSupabaseConfigured) return COUNTRIES;
  const { data, error } = await createPublicClient().from("countries").select("slug, name, flag, summary").eq("is_published", true).order("sort_order");
  if (error) throw unavailable("les pays", error);
  return (data ?? []).map((c) => ({ slug: c.slug, name: c.name, flag: c.flag ?? "", summary: c.summary ?? "" }));
}

export async function getCountry(slug: string): Promise<CountryView | null> {
  if (!isSupabaseConfigured) { const c = COUNTRIES.find((x) => x.slug === slug); return c ? fallbackCountry(c) : null; }
  const { data, error } = await createPublicClient().from("countries")
    .select("slug, name, flag, summary, description, institution_types, budget_info, visa_info, housing_info, official_links, country_procedures(id, title, body, required_documents, official_url, last_verified_at, sort_order)")
    .eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error) throw unavailable("la fiche pays", error);
  return data ? mapCountry(data as unknown as CountryRow) : null;
}

export async function getFaqs(): Promise<{ q: string; a: string }[]> {
  if (!isSupabaseConfigured) return FAQS;
  const { data, error } = await createPublicClient().from("faqs").select("question, answer").eq("is_published", true).order("sort_order");
  if (error) throw unavailable("la FAQ", error);
  return (data ?? []).map((f) => ({ q: f.question, a: f.answer }));
}
