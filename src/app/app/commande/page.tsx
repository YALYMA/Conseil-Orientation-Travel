import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getActivePacks } from "@/lib/data/student";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { formatFcfa, splitPayment } from "@/lib/payments/split";
import { placeOrder } from "@/app/app/actions";

export const metadata: Metadata = { title: "Choisir un pack", robots: { index: false } };

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ erreur?: string; pack?: string }> }) {
  await requireRole(["student"]);
  const { erreur, pack } = await searchParams;
  const packs = await getActivePacks();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Choisir un pack</h1>
      <p className="text-sm text-navy/75">Vous ne payez que 50 % pour commencer. Le solde est dû à la finalisation des prestations prévues. Aucune admission ni aucun visa n&apos;est garanti.</p>
      {erreur && <ErrorState message={erreur.slice(0, 200)} />}
      {packs.length === 0 && <EmptyState title="Aucun pack disponible" text="Les packs seront bientôt disponibles." />}
      <div className="grid gap-4 sm:grid-cols-2">
        {packs.map((p) => {
          const s = splitPayment(p.price_total);
          return (
            <Card key={p.slug} className={pack === p.slug ? "ring-2 ring-brand" : ""}>
              <div className="flex items-start justify-between gap-2"><h2 className="font-display text-lg font-bold">{p.name}</h2>{p.badge && <Badge tone="gold">{p.badge}</Badge>}</div>
              <p className="text-sm text-navy/70">{p.tagline}</p>
              <p className="mt-3 text-2xl font-extrabold">{formatFcfa(p.price_total)}</p>
              <p className="text-xs text-navy/60">{formatFcfa(s.first)} à la commande · {formatFcfa(s.balance)} à la finalisation</p>
              <form action={placeOrder} className="mt-4"><input type="hidden" name="slug" value={p.slug} /><Button type="submit" variant="cta" className="w-full">Commander ce pack</Button></form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
