import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getPack, getPacks } from "@/lib/content/public";
import { formatFcfa, splitPayment } from "@/lib/payments/split";

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Pack {pack.name}</h1>
      <p className="mt-1 text-navy/75">{pack.tagline}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-lg font-bold">Ce qui est inclus</h2>
            <ul className="mt-3 space-y-2 text-sm">{pack.features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden className="text-success">✓</span>{f}</li>)}</ul>
            <p className="mt-4 text-sm text-navy/70">Durée indicative : {pack.duration}.{pack.applications ? ` Candidatures incluses : ${pack.applications}.` : ""}</p>
          </Card>
          <Card className="border-danger/20">
            <h2 className="font-display text-lg font-bold">Ce qui n&apos;est pas inclus</h2>
            <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">{pack.excluded.map((x) => <li key={x} className="flex gap-2"><span aria-hidden className="text-danger">✕</span>{x}</li>)}</ul>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <p className="text-3xl font-extrabold">{formatFcfa(pack.price)}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt>{formatFcfa(s.first)}<br /><span className="text-navy/60">À la commande</span></dt></div>
            <div className="flex justify-between"><dt>{formatFcfa(s.balance)}<br /><span className="text-navy/60">À la finalisation des prestations</span></dt></div>
          </dl>
          <p className="mt-4 text-sm font-semibold text-brand">Vous ne payez que 50 % pour commencer.</p>
          <ButtonLink href={`/inscription?pack=${pack.slug}`} variant="cta" className="mt-4 w-full">Commander ce pack</ButtonLink>
          <p className="mt-3 text-xs text-navy/60">Le deuxième paiement est dû à la finalisation des prestations prévues dans le pack. Il ne dépend pas de la décision finale de l&apos;établissement ou de l&apos;autorité compétente.</p>
        </Card>
      </div>
    </div>
  );
}
