import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/public/PageHero";
import { Icon } from "@/components/visual/Icon";
import { cn } from "@/components/ui/cn";
import { getPack, getPacks } from "@/lib/content/public";
import { formatFcfa, splitPayment } from "@/lib/payments/split";
import { packStyle } from "@/lib/visuals";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPacks()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pack = await getPack(slug);
  if (!pack) return {};
  return { title: `Pack ${pack.name}`, description: `${pack.tagline}. ${formatFcfa(pack.price)}, payable en deux étapes.`, alternates: { canonical: `/packs/${slug}` } };
}

export default async function PackPage({ params }: Props) {
  const { slug } = await params;
  const pack = await getPack(slug);
  if (!pack) notFound();
  const s = splitPayment(pack.price);
  const st = packStyle(pack.slug);
  const pct = Math.round((s.first / pack.price) * 100);

  return (
    <>
      <PageHero eyebrow={pack.badge ?? "Pack d'accompagnement"} title={`Pack ${pack.name}`} text={pack.tagline} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1fr_360px]">
        {/* Prix : en premier sur mobile, à droite (collant) sur ordinateur */}
        <aside className="relative z-10 -mt-6 h-fit rounded-3xl bg-white p-6 shadow-[0_28px_50px_-24px_rgba(6,59,112,.45)] ring-1 ring-navy/5 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:mt-0">
          <span className={cn("flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg", st.iconBg, pack.slug === "premium" ? "text-navy" : "text-white")}><Icon name={st.icon} className="size-7" /></span>
          <p className="mt-4 flex items-baseline gap-1.5"><span className="font-display text-4xl font-extrabold tracking-tight">{formatFcfa(pack.price).replace(" FCFA", "")}</span><span className="text-sm font-bold">FCFA</span></p>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-navy/10" role="img" aria-label={`${pct} % à la commande, ${100 - pct} % à la finalisation`}><span className={cn("h-full rounded-full", st.bar)} style={{ width: `${pct}%` }} /></div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-navy/75">À la commande</dt><dd className="font-display text-lg font-extrabold">{formatFcfa(s.first)}</dd></div>
            <div className="text-right"><dt className="text-xs text-navy/75">À la finalisation</dt><dd className="font-display text-lg font-extrabold">{formatFcfa(s.balance)}</dd></div>
          </dl>
          <p className="mt-3 text-sm font-semibold text-brand">Vous ne payez que 50 % pour commencer.</p>
          <ButtonLink href={`/inscription?pack=${pack.slug}`} variant="cta" size="lg" className="mt-4 w-full">Commander ce pack<Icon name="arrow" className="size-5" /></ButtonLink>
          <ul className="mt-4 space-y-1.5 text-xs text-navy/75">
            {pack.duration && <li className="flex items-center gap-2"><Icon name="clock" className="size-4" />Durée indicative : {pack.duration}</li>}
            {pack.applications ? <li className="flex items-center gap-2"><Icon name="send" className="size-4" />Candidatures incluses : {pack.applications}</li> : null}
          </ul>
        </aside>

        <div className="space-y-6 lg:col-start-1 lg:row-start-1">
          <section className="rounded-3xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(6,59,112,.25)] ring-1 ring-navy/5">
            <h2 className="font-display text-xl font-extrabold">Ce qui est inclus</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {pack.features.map((f) => (
                <li key={f} className="flex gap-3 rounded-2xl bg-surface p-3 text-sm"><span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", st.soft, st.ink)}><Icon name="check" className="size-4" strokeWidth={3} /></span><span>{f}</span></li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(6,59,112,.25)] ring-1 ring-navy/5">
            <h2 className="font-display text-xl font-extrabold">Comment se passe le paiement</h2>
            <ol className="mt-5 grid gap-4 sm:grid-cols-3">
              {[["1", "À la commande", formatFcfa(s.first), "Vous réglez la première moitié via Wave et envoyez la preuve sur WhatsApp."], ["2", "Accompagnement", "Pendant les prestations", "Votre conseiller travaille avec vous ; vous suivez tout dans votre espace."], ["3", "À la finalisation", formatFcfa(s.balance), "Le solde est dû une fois les prestations du pack terminées."]].map(([n, t, a, d]) => (
                <li key={n} className="relative rounded-2xl border border-navy/10 p-4">
                  <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-navy font-display text-sm font-extrabold text-white">{n}</span>
                  <p className="mt-3 font-display font-bold">{t}</p><p className="font-display text-brand">{a}</p><p className="mt-1 text-xs leading-relaxed text-navy/75">{d}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-navy/75">Le deuxième paiement est dû à la finalisation des prestations prévues dans le pack. Il ne dépend pas de la décision finale de l&apos;établissement ou de l&apos;autorité compétente.</p>
          </section>

          <section className="rounded-3xl bg-[#fff6f6] p-6 ring-1 ring-danger/20">
            <h2 className="font-display text-xl font-extrabold">Ce qui n&apos;est pas inclus</h2>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {pack.excluded.map((x) => <li key={x} className="flex items-center gap-2.5"><span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#fde8e8] text-[#a82b2b]"><Icon name="close" className="size-3.5" strokeWidth={3} /></span>{x}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
