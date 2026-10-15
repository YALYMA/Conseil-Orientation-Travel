import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { CountryVisual } from "@/components/public/CountryVisual";
import { Flag, flagFor } from "@/components/visual/Flag";
import { Icon, type IconName } from "@/components/visual/Icon";
import { Wave } from "@/components/visual/Decor";
import { getCountries, getCountry } from "@/lib/content/public";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;
export async function generateStaticParams() { return (await getCountries()).map((c) => ({ slug: c.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCountry((await params).slug);
  if (!c) return {};
  return { title: `Étudier en ${c.name} depuis le Sénégal`, description: c.summary, alternates: { canonical: `/pays/${c.slug}` } };
}

const PENDING = "Nous publions cette rubrique uniquement à partir des sources officielles. Contactez un conseiller pour une information à jour.";

// Aucune procédure n'est inventée : une section sans contenu vérifié affiche « en cours de vérification ».
function Section({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(6,59,112,.25)] ring-1 ring-navy/5">
      <h2 className="flex items-center gap-3 font-display text-xl font-extrabold"><span aria-hidden className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon name={icon} /></span>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
const Pending = () => <p className="flex items-start gap-3 rounded-2xl bg-[#fff6e0] p-4 text-sm text-ink"><Icon name="clock" className="mt-0.5 size-5 text-[#8a6100]" /><span><strong>Information en cours de vérification.</strong> {PENDING}</span></p>;

export default async function CountryPage({ params }: Props) {
  const c = await getCountry((await params).slug);
  if (!c) notFound();
  const flag = flagFor(c.slug);
  // Rien de vérifié n'est publié : un seul encart clair plutôt que quatre blocs identiques.
  const hasContent = c.procedures.length > 0 || !!(c.budget || c.visa || c.housing);
  const text = (t: string) => (t ? <p className="whitespace-pre-line text-[15px] leading-relaxed">{t}</p> : <Pending />);

  return (
    <>
      <section className="relative isolate h-[400px] overflow-hidden bg-navy text-white sm:h-[460px]">
        <CountryVisual slug={c.slug} priority sizes="100vw" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-navy/10" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-20 sm:pb-24">
          <nav aria-label="Fil d'Ariane" className="text-sm text-white/90"><ol className="flex items-center gap-1.5"><li><Link href="/" className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">Accueil</Link></li><li aria-hidden>›</li><li><Link href="/pays" className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">Pays</Link></li><li aria-hidden>›</li><li aria-current="page" className="font-semibold">{c.name}</li></ol></nav>
          <div className="mt-3 flex items-center gap-3">{flag && <span className="rounded-lg bg-white p-1 shadow-lg"><Flag code={flag} className="h-6 w-9" /></span>}<h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">Étudier en {c.name}</h1></div>
          <p className="mt-3 max-w-2xl text-base text-white sm:text-lg">{c.summary}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 text-surface"><Wave className="h-8 sm:h-12" /></div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {(c.description || c.institutionTypes.length > 0) && (
            <Section icon="cap" title="Présentation">
              {c.description && text(c.description)}
              {c.institutionTypes.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{c.institutionTypes.map((t) => <li key={t} className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">{t}</li>)}</ul>}
            </Section>
          )}
          {hasContent ? (
            <>
              <Section icon="file" title="Procédure">
                {c.procedures.length === 0 ? <Pending /> : (
                  <div className="space-y-4">
                    {c.procedures.map((p, i) => (
                      <div key={p.id} className="flex gap-4 rounded-2xl border border-navy/10 p-4">
                        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-extrabold text-white">{i + 1}</span>
                        <div className="min-w-0"><h3 className="font-display font-bold">{p.title}</h3>
                          {p.body && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{p.body}</p>}
                          {p.documents.length > 0 && <p className="mt-2 text-sm"><strong>Documents :</strong> {p.documents.join(", ")}</p>}
                          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy/75">
                            {p.officialUrl && <a href={p.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center font-semibold text-brand underline">Source officielle</a>}
                            {p.verifiedAt && <span className="inline-flex min-h-8 items-center">Vérifié le {new Date(p.verifiedAt).toLocaleDateString("fr-FR")}</span>}
                          </p></div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
              <Section icon="wallet" title="Budget">{text(c.budget)}</Section>
              <Section icon="shield" title="Visa">{text(c.visa)}</Section>
              <Section icon="home" title="Logement">{text(c.housing)}</Section>
            </>
          ) : (
            <Section icon="file" title="Procédure, budget, visa et logement">
              <Pending />
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {["Procédure de candidature", "Budget à prévoir", "Visa et titre de séjour", "Logement"].map((t) => <li key={t} className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5"><Icon name="clock" className="size-4 text-navy/75" />{t}<span className="ml-auto text-xs font-semibold text-navy/75">à venir</span></li>)}
              </ul>
            </Section>
          )}
          {c.links.length > 0 && (
            <Section icon="pin" title="Liens officiels"><ul className="space-y-1">{c.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand underline">{l.label}<Icon name="arrow" className="size-4" /></a></li>)}</ul></Section>
          )}
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-3xl bg-gradient-to-br from-navy via-[#08457F] to-[#0A56CF] p-6 text-white shadow-[0_24px_44px_-22px_rgba(6,59,112,.7)]">
            <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-gold text-navy"><Icon name="compass" className="size-6" /></span>
            <h2 className="mt-4 font-display text-xl font-extrabold">Étudier en {c.name} : par où commencer ?</h2>
            <p className="mt-2 text-sm text-white/90">Faites le test d&apos;orientation gratuit ou parlez à un conseiller.</p>
            <ButtonLink href="/orientation" variant="cta" className="mt-4 w-full">Évaluer mon profil</ButtonLink>
            <ButtonLink href="/packs" variant="glass" className="mt-2 w-full">Découvrir nos packs</ButtonLink>
          </div>
          <p className="rounded-2xl bg-white p-4 text-xs leading-relaxed text-navy/75 ring-1 ring-navy/10">Conseil-Orientation-Travel n&apos;est affilié à aucune université, ambassade ni à Campus France. Les procédures officielles font foi.</p>
        </aside>
      </div>
    </>
  );
}
