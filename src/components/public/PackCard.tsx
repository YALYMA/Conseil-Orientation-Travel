import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/visual/Icon";
import { Rings } from "@/components/visual/Decor";
import { formatFcfa, splitPayment } from "@/lib/payments/split";
import { packStyle } from "@/lib/visuals";
import type { PackView } from "@/lib/content/defaults";

const MAX_FEATURES = 5;

export function PackCard({ pack, className }: { pack: PackView; className?: string }) {
  const st = packStyle(pack.slug);
  const s = splitPayment(pack.price);
  const pct = Math.round((s.first / pack.price) * 100);
  const hot = pack.badge === "Populaire";
  const more = pack.features.length - MAX_FEATURES;
  const amount = formatFcfa(pack.price).replace(" FCFA", "");

  return (
    <article className={cn("relative flex h-full flex-col overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1",
      hot ? "bg-gradient-to-br from-navy via-[#08457F] to-[#0A56CF] text-white shadow-[0_28px_50px_-22px_rgba(6,59,112,.8)] lg:scale-[1.03]"
        : "border border-navy/10 bg-white shadow-[0_1px_2px_rgba(6,59,112,.04),0_12px_30px_-16px_rgba(6,59,112,.2)] hover:shadow-[0_24px_44px_-20px_rgba(6,59,112,.3)]", className)}>
      <Rings className={cn("pointer-events-none absolute -right-12 -top-12 w-48", hot ? "text-white/15" : "text-navy/[.06]")} />
      {pack.badge && <span className="absolute right-4 top-4 max-w-[9rem] rounded-2xl bg-gold px-3 py-1 text-center text-xs font-bold leading-tight text-navy shadow-md">{pack.badge}</span>}

      <span className={cn("relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg", st.iconBg, pack.slug === "premium" ? "text-navy" : "text-white")}><Icon name={st.icon} className="size-7" /></span>
      <h3 className="relative mt-4 font-display text-xl font-extrabold">{pack.name}</h3>
      <p className={cn("relative mt-1 text-sm", hot ? "text-white" : "text-navy/75")}>{pack.tagline}</p>

      <p className="relative mt-5 flex items-baseline gap-1.5"><span className="font-display text-4xl font-extrabold tracking-tight">{amount}</span><span className="text-sm font-bold">FCFA</span></p>

      <div className="relative mt-4" role="img" aria-label={`Paiement en deux étapes : ${pct} % à la commande, ${100 - pct} % à la finalisation`}>
        <div className={cn("flex h-2.5 overflow-hidden rounded-full", hot ? "bg-white/20" : "bg-navy/10")}>
          <span className={cn("h-full rounded-full", hot ? "bg-gold" : st.bar)} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-xs leading-tight">
          <span><strong className="block text-sm">{formatFcfa(s.first)}</strong>à la commande</span>
          <span className="text-right"><strong className="block text-sm">{formatFcfa(s.balance)}</strong>à la finalisation</span>
        </div>
      </div>

      <ul className="relative mt-5 flex-1 space-y-2.5 text-sm">
        {pack.features.slice(0, MAX_FEATURES).map((f) => (
          <li key={f} className="flex gap-3">
            <span aria-hidden className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", hot ? "bg-gold text-navy" : cn(st.soft, st.ink))}><Icon name="check" className="size-3.5" strokeWidth={3} /></span>
            <span className={hot ? "text-white" : "text-ink"}>{f}</span>
          </li>
        ))}
        {more > 0 && <li className={cn("pl-8 text-xs font-semibold", hot ? "text-white" : "text-navy/75")}>+ {more} autre{more > 1 ? "s" : ""} prestation{more > 1 ? "s" : ""}</li>}
      </ul>

      <ButtonLink href={`/packs/${pack.slug}`} variant={hot ? "cta" : "primary"} className="relative mt-6 w-full">
        Choisir ce pack<span className="sr-only"> {pack.name}</span><Icon name="arrow" className="size-4" />
      </ButtonLink>
      <p className={cn("relative mt-3 text-center text-xs", hot ? "text-white" : "text-navy/75")}>Vous ne payez que 50 % pour commencer.</p>
    </article>
  );
}

/** Mobile : cartes à balayer (la suivante dépasse pour inviter au geste) ; ordinateur : grille. */
export function PackRail({ packs }: { packs: PackView[] }) {
  return (
    <div role="region" aria-label="Packs (défilement horizontal)" tabIndex={0} className="relative no-scrollbar -mx-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-4 pb-6 pt-3 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
      {packs.map((p) => <PackCard key={p.slug} pack={p} className="w-[84%] shrink-0 snap-center md:w-auto" />)}
    </div>
  );
}
