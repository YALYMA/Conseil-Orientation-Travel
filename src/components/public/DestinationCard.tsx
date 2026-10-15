import Link from "next/link";
import { CountryVisual } from "./CountryVisual";
import { Flag, flagFor } from "@/components/visual/Flag";
import { Icon } from "@/components/visual/Icon";
import { cn } from "@/components/ui/cn";

export interface DestinationView { slug: string; name: string; summary: string }

export function DestinationCard({ c, priority, className }: { c: DestinationView; priority?: boolean; className?: string }) {
  const flag = flagFor(c.slug);
  return (
    <Link href={`/pays/${c.slug}`} className={cn("group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-navy shadow-[0_18px_40px_-20px_rgba(6,59,112,.6)] transition-transform duration-300 hover:-translate-y-1", className)}>
      <CountryVisual slug={c.slug} priority={priority} className="transition-transform duration-700 group-hover:scale-105" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/45 to-transparent" />
      {flag && <span className="absolute left-3 top-3 rounded-lg bg-white p-1 shadow-md"><Flag code={flag} className="h-5 w-8" /></span>}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-2xl font-extrabold text-white">{c.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/90">{c.summary}</p>
        <span className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full bg-white/15 px-3 text-sm font-semibold text-white backdrop-blur transition-colors group-hover:bg-gold group-hover:text-navy">
          Découvrir<span className="sr-only"> {c.name}</span><Icon name="arrow" className="size-4" />
        </span>
      </div>
    </Link>
  );
}

/** Mobile : défilement horizontal (comme une application) ; tablette et ordinateur : grille. */
export function DestinationRail({ items }: { items: DestinationView[] }) {
  return (
    <div role="region" aria-label="Destinations (défilement horizontal)" tabIndex={0} className="relative no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
      {items.map((c, i) => <DestinationCard key={c.slug} c={c} priority={i < 2} className="w-[68%] shrink-0 snap-center sm:w-auto" />)}
    </div>
  );
}
