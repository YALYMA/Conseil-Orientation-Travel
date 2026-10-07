import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { formatFcfa, splitPayment } from "@/lib/payments/split";
import type { PackView } from "@/lib/content/defaults";
import { cn } from "@/components/ui/cn";

export function PackCard({ pack }: { pack: PackView }) {
  const s = splitPayment(pack.price);
  return (
    <Card className={cn("flex flex-col", pack.badge === "Populaire" && "border-brand ring-1 ring-brand")}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg font-bold">{pack.name}</h3>
        {pack.badge && <Badge tone="gold">{pack.badge}</Badge>}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-navy">{formatFcfa(pack.price)}</p>
      <p className="text-xs text-navy/65">{formatFcfa(s.first)} à la commande · {formatFcfa(s.balance)} à la finalisation</p>
      <ul className="mt-4 flex-1 space-y-1.5 text-sm">
        {pack.features.slice(0, 4).map((f) => <li key={f} className="flex gap-2"><span aria-hidden className="text-success">✓</span>{f}</li>)}
      </ul>
      <ButtonLink href={`/packs/${pack.slug}`} className="mt-5">Choisir ce pack</ButtonLink>
      <Link href={`/packs/${pack.slug}`} className="sr-only">Détail du pack {pack.name}</Link>
    </Card>
  );
}
