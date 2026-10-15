import Link from "next/link";
import { LogoMark } from "@/components/visual/LogoMark";
import { HeroArt } from "@/components/visual/HeroArt";
import { Rings, DotGrid } from "@/components/visual/Decor";
import { Icon } from "@/components/visual/Icon";

const POINTS = ["Suivez votre dossier étape par étape", "Déposez vos documents en sécurité", "Échangez avec votre conseiller"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-navy via-[#08457F] to-[#0A56CF] p-10 text-white lg:flex lg:flex-col">
        <Rings className="absolute -right-24 -top-24 w-[28rem] text-white/15" /><DotGrid className="absolute right-10 top-44 text-white/20" rows={6} cols={9} />
        <Link href="/" className="relative flex items-center gap-3"><LogoMark className="size-11" /><span className="font-display text-xl font-extrabold leading-tight">Conseil-Orientation-<br />Travel</span></Link>
        <div className="relative mx-auto my-auto w-full max-w-sm"><HeroArt className="w-full drop-shadow-2xl" /></div>
        <ul className="relative space-y-2.5">{POINTS.map((p) => <li key={p} className="flex items-center gap-3 text-[15px]"><span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-gold text-navy"><Icon name="check" className="size-4" strokeWidth={3} /></span>{p}</li>)}</ul>
      </aside>
      <div className="flex min-h-screen flex-col bg-surface">
        <header className="flex items-center justify-between px-4 pt-safe lg:hidden"><Link href="/" className="mt-3 flex min-h-11 items-center gap-2.5"><LogoMark /><span className="font-display text-base font-extrabold text-navy">Conseil-Orientation-Travel</span></Link></header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:py-14">
          <div className="rounded-3xl bg-white p-6 shadow-[0_28px_60px_-30px_rgba(6,59,112,.5)] ring-1 ring-navy/5 sm:p-8">{children}</div>
          <p className="mt-5 text-center text-sm"><Link href="/" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-navy/75 hover:text-brand"><Icon name="home" className="size-4" />Retour à l&apos;accueil</Link></p>
        </main>
      </div>
    </div>
  );
}
