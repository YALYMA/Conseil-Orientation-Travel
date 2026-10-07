import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/pays", label: "Pays" },
  { href: "/packs", label: "Nos packs" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/a-propos", label: "À propos" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-display text-base font-extrabold text-navy sm:text-lg">Conseil-Orientation-Travel</Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 text-sm font-medium lg:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="text-navy/80 hover:text-brand">{n.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/connexion" variant="outline" className="min-h-10">Connexion</ButtonLink>
          <ButtonLink href="/inscription" className="min-h-10">Inscription</ButtonLink>
        </div>
        {/* Menu mobile sans JavaScript : <details> accessible au clavier */}
        <details className="group relative lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-navy/20 px-3 text-sm font-semibold" aria-label="Ouvrir le menu">
            <span aria-hidden className="mr-2">☰</span>Menu
          </summary>
          <nav aria-label="Menu mobile" className="absolute right-0 mt-2 w-64 space-y-1 rounded-xl border border-navy/10 bg-white p-3 shadow-lg">
            {NAV.map((n) => <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-brand-soft">{n.label}</Link>)}
            <div className="grid gap-2 pt-2">
              <ButtonLink href="/connexion" variant="outline">Connexion</ButtonLink>
              <ButtonLink href="/inscription">Inscription</ButtonLink>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
