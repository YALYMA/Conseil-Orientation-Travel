import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/visual/Icon";
import { Flag, flagFor } from "@/components/visual/Flag";
import { HeroArt } from "@/components/visual/HeroArt";
import { Rings, DotGrid, Wave } from "@/components/visual/Decor";
import { findPhoto } from "@/lib/visuals";

interface Country { slug: string; name: string }

function FloatingCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`absolute z-10 rounded-2xl bg-white p-3 text-navy shadow-[0_18px_36px_-14px_rgba(0,0,0,.45)] ${className ?? ""}`}>{children}</div>;
}

/** Bannière d'accueil. La photo `public/images/hero/hero.*` (si fournie) remplace l'illustration. */
export function Hero({ countries }: { countries: Country[] }) {
  const photo = findPhoto("hero", "hero");
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(900px_520px_at_85%_10%,rgba(11,99,246,.75),transparent_60%),radial-gradient(600px_400px_at_0%_100%,rgba(11,99,246,.35),transparent_60%),linear-gradient(180deg,#063B70,#052a50)]" />
      <Rings className="absolute -left-28 bottom-6 w-[26rem] text-white/10" />
      <DotGrid className="absolute right-6 top-6 hidden text-white/20 md:block" rows={7} cols={10} />

      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-24 pt-10 sm:pb-28 sm:pt-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-6 lg:pb-32 lg:pt-16">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur sm:text-sm">
            <Icon name="sparkles" className="size-4 text-gold" />Études à l&apos;étranger depuis le Sénégal
          </p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Construisez votre projet d&apos;<span className="text-gold">études à l&apos;étranger</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            Un accompagnement personnalisé pour choisir votre formation, préparer votre dossier et suivre votre candidature étape par étape.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/orientation" variant="cta" size="lg">Évaluer mon profil gratuitement<Icon name="arrow" className="size-5" /></ButtonLink>
            <ButtonLink href="/packs" variant="glass" size="lg">Découvrir nos packs</ButtonLink>
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/90">
            {["Gratuit", "3 minutes", "Sans inscription"].map((t) => <li key={t} className="flex items-center gap-1.5"><Icon name="check" className="size-4 text-gold" strokeWidth={3} />{t}</li>)}
          </ul>
          <ul aria-label="Destinations" className="mt-7 flex flex-wrap gap-2">
            {countries.map((c) => { const f = flagFor(c.slug); return (
              <li key={c.slug}><Link href={`/pays/${c.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-sm font-bold text-navy shadow-sm transition-transform hover:-translate-y-0.5">{f && <Flag code={f} className="h-4 w-6" />}{c.name}</Link></li>
            ); })}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[420px] lg:max-w-[500px]">
          {photo ? (
            <div className="relative aspect-[5/6] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/20">
              <Image src={photo} alt="" fill priority sizes="(min-width:1024px) 480px, 90vw" className="object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent" />
            </div>
          ) : <HeroArt className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,.35)]" />}

          <FloatingCard className="left-0 top-[6%] flex animate-float items-center gap-2.5 sm:-left-4">
            <span aria-hidden className="flex size-9 items-center justify-center rounded-xl bg-[#E7F7F0] text-[#0D7A50]"><Icon name="check" strokeWidth={3} /></span>
            <span className="text-xs leading-tight"><strong className="block text-sm">Profil analysé</strong>Pistes d&apos;orientation prêtes</span>
          </FloatingCard>
          <FloatingCard className="bottom-[2%] left-0 w-44 animate-float-slow sm:-left-6 sm:w-52">
            <p className="flex items-center justify-between text-xs font-bold"><span>Votre dossier</span><span className="text-brand">80 %</span></p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-soft"><div className="h-full w-4/5 rounded-full bg-brand" /></div>
            <p className="mt-1.5 text-[11px] leading-tight text-navy/75">Prochaine étape : lettres de motivation</p>
          </FloatingCard>
          <FloatingCard className="right-0 top-[44%] flex animate-float items-center gap-2.5 sm:-right-4">
            <span aria-hidden className="flex size-9 items-center justify-center rounded-xl bg-[#FFF4D6] text-[#8A6100]"><Icon name="wallet" /></span>
            <span className="text-xs leading-tight"><strong className="block text-sm">Paiement en 2 étapes</strong>50 % pour commencer</span>
          </FloatingCard>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 text-surface"><Wave /></div>
    </section>
  );
}
