import { EXCLUDED_DEFAULT, type PackView } from "./defaults";

export interface PackRow {
  slug: string; name: string; tagline: string | null; price_total: number; badge: string | null; indicative_duration: string | null;
  included_applications: number | null; excluded_services: string[] | null; pack_features: { label: string; sort_order: number }[] | null;
}
export function mapPack(r: PackRow): PackView {
  return {
    slug: r.slug, name: r.name, tagline: r.tagline ?? "", price: r.price_total, badge: r.badge ?? undefined,
    duration: r.indicative_duration ?? "", applications: r.included_applications ?? undefined,
    features: [...(r.pack_features ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((f) => f.label),
    excluded: r.excluded_services?.length ? r.excluded_services : EXCLUDED_DEFAULT,
  };
}

export interface CountryView {
  slug: string; name: string; flag: string; summary: string; description: string; institutionTypes: string[];
  budget: string; visa: string; housing: string; links: { label: string; url: string }[];
  procedures: { id: string; title: string; body: string; documents: string[]; officialUrl: string | null; verifiedAt: string | null }[];
}
export interface CountryRow {
  slug: string; name: string; flag: string | null; summary: string | null; description: string | null; institution_types: string[] | null;
  budget_info: string | null; visa_info: string | null; housing_info: string | null; official_links: unknown;
  country_procedures?: { id: string; title: string; body: string | null; required_documents: string[] | null; official_url: string | null; last_verified_at: string | null; sort_order: number }[] | null;
}
/** Défensif : on ne fait jamais confiance au JSON stocké (liens non https ignorés). */
const safeLinks = (v: unknown): CountryView["links"] =>
  Array.isArray(v) ? v.flatMap((l) => (l && typeof l.url === "string" && /^https:\/\/\S+$/.test(l.url) ? [{ label: String(l.label ?? l.url).slice(0, 80), url: l.url }] : [])) : [];

export function mapCountry(r: CountryRow): CountryView {
  return {
    slug: r.slug, name: r.name, flag: r.flag ?? "", summary: r.summary ?? "", description: r.description ?? "", institutionTypes: r.institution_types ?? [],
    budget: r.budget_info ?? "", visa: r.visa_info ?? "", housing: r.housing_info ?? "", links: safeLinks(r.official_links),
    procedures: [...(r.country_procedures ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((p) => ({
      id: p.id, title: p.title, body: p.body ?? "", documents: p.required_documents ?? [],
      officialUrl: p.official_url && /^https:\/\/\S+$/.test(p.official_url) ? p.official_url : null, verifiedAt: p.last_verified_at,
    })),
  };
}
