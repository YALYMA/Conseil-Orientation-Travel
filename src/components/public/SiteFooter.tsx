import Link from "next/link";
import { COUNTRIES as FALLBACK } from "@/lib/content/defaults";
import { getCountries } from "@/lib/content/public";

export async function SiteFooter() {
  const COUNTRIES = await getCountries().catch(() => FALLBACK); // le pied de page ne doit jamais casser une page
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-lg font-extrabold">Conseil-Orientation-Travel</p>
          <p className="mt-2 text-sm text-white/75">Plateforme digitale d&apos;orientation, de conseil et d&apos;accompagnement aux études à l&apos;étranger.</p>
        </div>
        <nav aria-label="Liens utiles">
          <p className="font-semibold">Liens utiles</p>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li><Link href="/packs">Nos packs</Link></li><li><Link href="/comment-ca-marche">Comment ça marche</Link></li>
            <li><Link href="/orientation">Test d&apos;orientation</Link></li><li><Link href="/faq">FAQ</Link></li><li><Link href="/contact">Contact</Link></li>
          </ul>
        </nav>
        <nav aria-label="Pays">
          <p className="font-semibold">Pays</p>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            {COUNTRIES.map((c) => <li key={c.slug}><Link href={`/pays/${c.slug}`}>{c.flag} {c.name}</Link></li>)}
          </ul>
        </nav>
        <div className="text-sm text-white/75">
          <p className="font-semibold text-white">À savoir</p>
          <p className="mt-3">Nous ne garantissons ni admission ni visa. La décision finale appartient aux établissements et aux autorités compétentes. Conseil-Orientation-Travel n&apos;est affilié à aucune université, ambassade ni à Campus France.</p>
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center text-xs text-white/65">
        <p>© {new Date().getFullYear()} Conseil-Orientation-Travel. Tous droits réservés. ·{" "}
          <Link href="/mentions-legales" className="underline">Mentions légales</Link> ·{" "}
          <Link href="/confidentialite" className="underline">Confidentialité</Link> ·{" "}
          <Link href="/cgu" className="underline">CGU</Link></p>
      </div>
    </footer>
  );
}
