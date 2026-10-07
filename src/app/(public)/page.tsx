import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PackCard } from "@/components/public/PackCard";
import { HOW_IT_WORKS } from "@/lib/content/defaults";
import { getCountries, getPacks } from "@/lib/content/public";
import { Timeline } from "@/components/ui/Timeline";

export const metadata: Metadata = {
  title: "Études à l'étranger depuis le Sénégal : orientation et accompagnement",
  description: "Choisissez votre formation, préparez votre dossier et suivez votre candidature étape par étape : France, Belgique, Luxembourg, Italie, Maroc.",
  alternates: { canonical: "/" },
  openGraph: { title: "Construisez votre projet d'études à l'étranger", description: "Un accompagnement personnalisé, un paiement en 2 étapes et un espace étudiant sécurisé.", url: "/" },
};

const TRUST = ["Paiement en 2 étapes", "Suivi personnalisé", "Espace étudiant sécurisé", "Conseillers disponibles"];
const STEPS = ["Orientation", "Candidature", "Dossier", "Suivi", "Préparation"];

export const revalidate = 60;

export default async function HomePage() {
  const [PACKS, COUNTRIES] = await Promise.all([getPacks(), getCountries()]);
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="font-display max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">Construisez votre projet d&apos;études à l&apos;étranger</h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
            Un accompagnement personnalisé pour choisir votre formation, préparer votre dossier et suivre votre candidature étape par étape.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Nos services">
            {STEPS.map((s) => <li key={s} className="rounded-full bg-white/10 px-3 py-1">{s}</li>)}
          </ul>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Destinations">
            {COUNTRIES.map((c) => (
              <li key={c.slug}><Link href={`/pays/${c.slug}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-navy"><span aria-hidden>{c.flag}</span>{c.name}</Link></li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/orientation" variant="cta">Évaluer mon profil gratuitement</ButtonLink>
            <ButtonLink href="/packs" variant="outline">Découvrir nos packs</ButtonLink>
          </div>
        </div>
      </section>

      <section aria-label="Garanties de service" className="border-b border-navy/10 bg-white">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 text-sm font-semibold sm:grid-cols-4">
          {TRUST.map((t) => <li key={t} className="flex items-center gap-2"><span aria-hidden className="text-success">✓</span>{t}</li>)}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold">Nos destinations</h2>
        <p className="mt-1 text-navy/70">Découvrez les pays où vous pouvez poursuivre vos études.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COUNTRIES.map((c) => (
            <Card key={c.slug} className="flex flex-col">
              <p className="text-3xl" aria-hidden>{c.flag}</p>
              <h3 className="mt-2 font-semibold">{c.name}</h3>
              <p className="mt-1 flex-1 text-sm text-navy/70">{c.summary}</p>
              <Link href={`/pays/${c.slug}`} className="mt-3 text-sm font-semibold text-brand">En savoir plus<span className="sr-only"> sur {c.name}</span></Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-brand-soft">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold">Vous ne savez pas par où commencer ?</h2>
            <p className="text-navy/75">Répondez à quelques questions : vous verrez quelles pistes correspondent à votre profil.</p>
          </div>
          <ButtonLink href="/orientation">Faire le test d&apos;orientation</ButtonLink>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold">Nos packs</h2>
        <p className="mt-1 text-navy/70">Vous ne payez que 50 % pour commencer.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{PACKS.map((p) => <PackCard key={p.slug} pack={p} />)}</div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="font-display text-2xl font-bold">Comment ça marche</h2>
          <div className="mt-6"><Timeline steps={HOW_IT_WORKS} /></div>
        </div>
      </section>
    </>
  );
}
