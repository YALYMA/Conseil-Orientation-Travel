import { Rings, DotGrid, Wave } from "@/components/visual/Decor";
import { cn } from "@/components/ui/cn";

/** Bannière de page intérieure : dégradé de marque, décors, vague de transition vers le contenu. */
export function PageHero({ eyebrow, title, text, children, className }: { eyebrow?: string; title: string; text?: string; children?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("relative overflow-hidden bg-gradient-to-br from-navy via-[#08457F] to-[#0A56CF] text-white", className)}>
      <Rings className="absolute -right-20 -top-24 w-96 text-white/15" />
      <DotGrid className="absolute bottom-8 left-4 hidden text-white/20 sm:block" rows={5} cols={8} />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:pb-24 sm:pt-16">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[.14em] text-gold">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">{text}</p>}
        {children && <div className="mt-6 flex flex-col gap-3 sm:flex-row">{children}</div>}
      </div>
      <div className="absolute inset-x-0 bottom-0 text-surface"><Wave /></div>
    </section>
  );
}
