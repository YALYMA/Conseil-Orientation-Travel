import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getCountries } from "@/lib/content/public";

export const metadata: Metadata = {
  title: "Études à l'étranger : nos destinations",
  description: "France, Belgique, Luxembourg, Italie, Maroc : découvrez les possibilités d'études depuis le Sénégal.",
  alternates: { canonical: "/pays" },
};

export const revalidate = 60;

export default async function CountriesPage() {
  const COUNTRIES = await getCountries();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Nos destinations</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COUNTRIES.map((c) => (
          <Card key={c.slug}>
            <p className="text-4xl" aria-hidden>{c.flag}</p>
            <h2 className="mt-2 font-display text-lg font-bold">{c.name}</h2>
            <p className="mt-1 text-sm text-navy/70">{c.summary}</p>
            <Link href={`/pays/${c.slug}`} className="mt-3 inline-block text-sm font-semibold text-brand">En savoir plus<span className="sr-only"> sur {c.name}</span></Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
