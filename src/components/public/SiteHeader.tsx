import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/visual/LogoMark";
import { NavLink } from "@/components/shell/NavLink";
import { MobileMenu } from "./MobileMenu";

/** `from` : largeur minimale d'écran à partir de laquelle le lien apparaît dans la barre (les autres restent dans le menu mobile et le pied de page). */
export const NAV: { href: string; label: string; from?: "xl" | "2xl" }[] = [
  { href: "/", label: "Accueil" },
  { href: "/pays", label: "Pays" },
  { href: "/packs", label: "Nos packs" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/a-propos", label: "À propos", from: "2xl" },
  { href: "/blog", label: "Blog", from: "2xl" },
  { href: "/contact", label: "Contact", from: "xl" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white pt-safe">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2.5 lg:shrink-0" aria-label="Conseil-Orientation-Travel, accueil">
          <LogoMark />
          <span className="font-display text-[15px] font-extrabold leading-tight text-navy sm:whitespace-nowrap sm:text-lg">Conseil-Orientation-Travel</span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 whitespace-nowrap lg:flex xl:gap-6">
          {NAV.map((n) => <span key={n.href} className={n.from === "2xl" ? "hidden 2xl:block" : n.from === "xl" ? "hidden xl:block" : undefined}><NavLink href={n.href} label={n.label} variant="top" exact={n.href === "/"} /></span>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/connexion" variant="outline" className="min-h-10">Connexion</ButtonLink>
          <ButtonLink href="/inscription" className="min-h-10">Inscription</ButtonLink>
        </div>
        <MobileMenu links={NAV} />
      </div>
    </header>
  );
}
