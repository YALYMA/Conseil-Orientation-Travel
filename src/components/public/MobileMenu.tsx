"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/visual/Icon";
import { NavLink } from "@/components/shell/NavLink";
import { ButtonLink } from "@/components/ui/Button";

export interface MenuLink { href: string; label: string }

/** Menu de l'en-tête sur mobile : feuille plein écran, fermée automatiquement au changement de page. */
export function MobileMenu({ links }: { links: MenuLink[] }) {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenAt(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpenAt(open ? null : pathname)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="flex size-11 items-center justify-center rounded-xl border border-navy/15 bg-white text-navy">
        <Icon name={open ? "close" : "menu"} className="size-6" />
      </button>
      {open && (
        <div id="mobile-menu" role="dialog" aria-label="Menu" className="fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top,0px))] z-40 overflow-y-auto bg-white p-4 animate-fade-up">
          <nav aria-label="Menu mobile" className="grid gap-1">
            {links.map((l) => <NavLink key={l.href} href={l.href} label={l.label} variant="row" onNavigate={() => setOpenAt(null)} />)}
          </nav>
          <div className="mt-5 grid gap-3">
            <ButtonLink href="/inscription" size="lg">Créer mon compte</ButtonLink>
            <ButtonLink href="/connexion" variant="outline" size="lg">Connexion</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
