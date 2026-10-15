import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/public/Hero";
import { TrustBar } from "@/components/public/TrustBar";
import { SectionTitle } from "@/components/public/SectionTitle";
import { DestinationRail } from "@/components/public/DestinationCard";
import { StepsGrid } from "@/components/public/StepsGrid";
import { PackRail } from "@/components/public/PackCard";
import { AppPreview } from "@/components/public/AppPreview";
import { CtaBand } from "@/components/public/CtaBand";
import { Icon } from "@/components/visual/Icon";
import { Blob, Wave } from "@/components/visual/Decor";
import { getCountries, getPacks } from "@/lib/content/public";

export const metadata: Metadata = {
  title: "Études à l'étranger depuis le Sénégal : orientation et accompagnement",
  description: "Choisissez votre formation, préparez votre dossier et suivez votre candidature étape par étape : France, Belgique, Luxembourg, Italie, Maroc.",
  alternates: { canonical: "/" },
  openGraph: { title: "Construisez votre projet d'études à l'étranger", description: "Un accompagnement personnalisé, un paiement en 2 étapes et un espace étudiant sécurisé.", url: "/" },
};

export const revalidate = 60;

export default async function HomePage() {
  const [packs, countries] = await Promise.all([getPacks(), getCountries()]);
  return (
    <>
      <Hero countries={countries} />
      <TrustBar />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Destinations" title="Où souhaitez-vous étudier ?" text="Cinq destinations pour poursuivre vos études, avec des informations vérifiées sur les sources officielles." />
          <Link href="/pays" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand">Voir tous les pays<Icon name="arrow" className="size-4" /></Link>
        </div>
        <div className="mt-8"><DestinationRail items={countries} /></div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 sm:py-20">
        <Blob className="absolute -right-24 top-10 w-80 text-brand-soft" />
        <div className="relative mx-auto max-w-6xl px-4">
          <SectionTitle eyebrow="Comment ça marche" title="Six étapes, de l'idée à la candidature" text="Un parcours simple et transparent : vous savez toujours ce qui a été fait et ce qui vient ensuite." align="center" />
          <div className="mt-10"><StepsGrid /></div>
        </div>
      </section>

      <section className="relative bg-brand-soft/70">
        <div className="text-white"><Wave flip className="text-white" /></div>
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
          <SectionTitle eyebrow="Nos packs" title="Un accompagnement à votre mesure" text="Vous ne payez que 50 % pour commencer ; le solde est dû à la finalisation des prestations prévues." align="center" />
          <div className="mt-6"><PackRail packs={packs} /></div>
          <p className="mt-2 text-center"><Link href="/packs" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand">Comparer tous les packs<Icon name="arrow" className="size-4" /></Link></p>
        </div>
        <div className="text-surface"><Wave className="-mb-px" /></div>
      </section>

      <section className="overflow-x-clip"><div className="mx-auto max-w-6xl px-4 py-16 sm:py-20"><AppPreview /></div></section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-24"><CtaBand /></section>
    </>
  );
}
