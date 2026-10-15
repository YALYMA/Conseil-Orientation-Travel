import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/visual/Icon";
import { Rings, DotGrid } from "@/components/visual/Decor";

export function CtaBand({ title = "Vous ne savez pas par où commencer ?", text = "Répondez à quelques questions : vous verrez quelles pistes correspondent à votre profil.", href = "/orientation", cta = "Faire le test d'orientation" }: { title?: string; text?: string; href?: string; cta?: string }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy via-[#08457F] to-[#0A56CF] p-7 text-white sm:p-10">
      <Rings className="absolute -right-16 -top-20 w-80 text-white/15" /><DotGrid className="absolute bottom-4 left-4 hidden text-white/20 sm:block" rows={4} cols={8} />
      <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4 sm:gap-5">
          <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg sm:size-16"><Icon name="cap" className="size-8" /></span>
          <div><h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h2><p className="mt-2 max-w-xl text-white/90">{text}</p></div>
        </div>
        <ButtonLink href={href} variant="cta" size="lg" className="w-full shrink-0 md:w-auto">{cta}<Icon name="arrow" className="size-5" /></ButtonLink>
      </div>
    </section>
  );
}
