import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCountries, getCountry } from "@/lib/content/public";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;
export async function generateStaticParams() { return (await getCountries()).map((c) => ({ slug: c.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCountry((await params).slug);
  if (!c) return {};
  return { title: `Étudier en ${c.name} depuis le Sénégal`, description: c.summary, alternates: { canonical: `/pays/${c.slug}` } };
}

// Aucune procédure n'est inventée : une section sans contenu vérifié affiche un état « en cours de vérification ».
function TextSection({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-3">
        {text ? <p className="whitespace-pre-line text-sm leading-relaxed">{text}</p>
          : <EmptyState title="Information en cours de vérification" text="Nous publions cette rubrique uniquement à partir des sources officielles. Contactez un conseiller pour une information à jour." />}
      </div>
    </Card>
  );
}

export default async function CountryPage({ params }: Props) {
  const c = await getCountry((await params).slug);
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-5xl" aria-hidden>{c.flag}</p>
      <h1 className="font-display mt-2 text-3xl font-extrabold">Étudier en {c.name}</h1>
      <p className="mt-2 text-navy/75">{c.summary}</p>
      {c.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{c.description}</p>}
      {c.institutionTypes.length > 0 && <p className="mt-3 text-sm"><strong>Types d&apos;établissements :</strong> {c.institutionTypes.join(", ")}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/orientation" variant="cta">Évaluer mon profil gratuitement</ButtonLink>
        <ButtonLink href="/packs" variant="outline">Découvrir nos packs</ButtonLink>
      </div>

      <div className="mt-10 space-y-4">
        <Card>
          <h2 className="font-display text-lg font-bold">Procédure</h2>
          <div className="mt-3 space-y-4">
            {c.procedures.length === 0 && <EmptyState title="Information en cours de vérification" text="Nous publions la procédure uniquement à partir des sources officielles. Contactez un conseiller pour une information à jour." />}
            {c.procedures.map((p) => (
              <div key={p.id} className="rounded-lg border border-navy/10 p-3">
                <h3 className="font-semibold">{p.title}</h3>
                {p.body && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{p.body}</p>}
                {p.documents.length > 0 && <p className="mt-2 text-sm"><strong>Documents :</strong> {p.documents.join(", ")}</p>}
                <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-navy/65">
                  {p.officialUrl && <a href={p.officialUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">Source officielle</a>}
                  {p.verifiedAt && <span>Vérifié le {new Date(p.verifiedAt).toLocaleDateString("fr-FR")}</span>}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <TextSection title="Budget" text={c.budget} />
        <TextSection title="Visa" text={c.visa} />
        <TextSection title="Logement" text={c.housing} />
        {c.links.length > 0 && (
          <Card><h2 className="font-display text-lg font-bold">Liens officiels</h2>
            <ul className="mt-2 space-y-1 text-sm">{c.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">{l.label}</a></li>)}</ul></Card>
        )}
      </div>
      <p className="mt-8 text-xs text-navy/60">Conseil-Orientation-Travel n&apos;est affilié à aucune université, ambassade ni à Campus France. Les procédures officielles font foi.</p>
    </div>
  );
}
