import type { MetadataRoute } from "next";
import { getCountries, getPacks } from "@/lib/content/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [PACKS, COUNTRIES] = await Promise.all([getPacks().catch(() => []), getCountries().catch(() => [])]);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fixed = ["", "/pays", "/packs", "/orientation", "/comment-ca-marche", "/a-propos", "/blog", "/faq", "/contact", "/mentions-legales", "/confidentialite", "/cgu"];
  return [
    ...fixed.map((p) => ({ url: `${base}${p}` })),
    ...COUNTRIES.map((c) => ({ url: `${base}/pays/${c.slug}` })),
    ...PACKS.map((p) => ({ url: `${base}/packs/${p.slug}` })),
  ];
}
