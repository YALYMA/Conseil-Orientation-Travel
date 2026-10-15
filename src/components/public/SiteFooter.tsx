import Link from "next/link";
import { COUNTRIES as FALLBACK } from "@/lib/content/defaults";
import { getCountries } from "@/lib/content/public";
import { LogoMark } from "@/components/visual/LogoMark";
import { Flag, flagFor } from "@/components/visual/Flag";
import { Rings, DotGrid } from "@/components/visual/Decor";

const link = "inline-flex min-h-11 min-w-11 items-center text-sm text-white/80 transition-colors hover:text-white";

export async function SiteFooter() {
  const COUNTRIES = await getCountries().catch(() => FALLBACK); // le pied de page ne doit jamais casser une page
  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-b from-navy to-[#052a50] text-white">
      <Rings className="absolute -right-24 -top-24 w-96 text-white/10" />
      <DotGrid className="absolute bottom-24 left-6 hidden text-white/15 md:block" rows={5} cols={7} />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div>
          <div className="flex items-center gap-3"><LogoMark className="size-10" /><p className="font-display text-lg font-extrabold leading-tight">Conseil-Orientation-<br />Travel</p></div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/80">Plateforme digitale d&apos;orientation, de conseil et d&apos;accompagnement aux études à l&apos;étranger.</p>
        </div>
        <nav aria-label="Liens utiles">
          <p className="font-display font-bold">Liens utiles</p>
          <ul className="mt-2">
            {[["/packs", "Nos packs"], ["/comment-ca-marche", "Comment ça marche"], ["/orientation", "Test d'orientation"], ["/faq", "FAQ"], ["/contact", "Contact"]].map(([h, l]) => <li key={h}><Link href={h} className={link}>{l}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Pays">
          <p className="font-display font-bold">Pays</p>
          <ul className="mt-2">
            {COUNTRIES.map((c) => { const f = flagFor(c.slug); return <li key={c.slug}><Link href={`/pays/${c.slug}`} className={`${link} gap-2.5`}>{f && <Flag code={f} className="h-3.5 w-5" />}{c.name}</Link></li>; })}
          </ul>
        </nav>
        <div>
          <p className="font-display font-bold">À savoir</p>
          <p className="mt-3 text-sm leading-relaxed text-white/80">Nous ne garantissons ni admission ni visa. La décision finale appartient aux établissements et aux autorités compétentes. Conseil-Orientation-Travel n&apos;est affilié à aucune université, ambassade ni à Campus France.</p>
        </div>
      </div>
      <div className="relative border-t border-white/15 px-4 py-5 pb-28 text-center text-xs text-white/75 lg:pb-5">
        <p>© {new Date().getFullYear()} Conseil-Orientation-Travel. Tous droits réservés.</p>
        <p className="mt-1 flex flex-wrap justify-center gap-x-4">
          <Link href="/mentions-legales" className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 underline">Mentions légales</Link>
          <Link href="/confidentialite" className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 underline">Confidentialité</Link>
          <Link href="/cgu" className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 underline">CGU</Link>
        </p>
      </div>
    </footer>
  );
}
