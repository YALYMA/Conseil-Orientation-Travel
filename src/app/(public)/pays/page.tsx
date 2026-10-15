import type { Metadata } from "next";
import { DestinationCard } from "@/components/public/DestinationCard";
import { PageHero } from "@/components/public/PageHero";
import { CtaBand } from "@/components/public/CtaBand";
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
    <>
      <PageHero eyebrow="Destinations" title="Nos destinations" text="Choisissez le pays où vous souhaitez poursuivre vos études et découvrez les informations officielles à connaître." />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative z-10 -mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">{COUNTRIES.map((c, i) => <DestinationCard key={c.slug} c={c} priority={i < 3} className="aspect-[4/5] sm:aspect-[5/4]" />)}</div>
        <div className="mt-14"><CtaBand title="Quelle destination vous correspond ?" text="Le test d'orientation compare votre profil, votre budget et vos langues pour proposer des pistes." /></div>
      </div>
    </>
  );
}
