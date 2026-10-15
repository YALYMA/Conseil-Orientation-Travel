"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/visual/Icon";
import { NavLink } from "./NavLink";

export interface MoreItem { href: string; label: string; icon: IconName }

/**
 * ATTENTION : ne jamais mettre backdrop-filter / transform / filter sur un ancêtre de ce composant : cela le rend « bloc de référence »
 * des éléments `fixed` (la feuille et le fond sombre seraient alors confinés à la barre au lieu de couvrir l'écran).
 */
/** Onglet « Plus » de la barre mobile : feuille avec les autres pages et la déconnexion (fournie par le serveur en `children`). */
export function MoreMenu({ items, children }: { items: MoreItem[]; children?: React.ReactNode }) {
  const pathname = usePathname();
  // État dérivé : le menu est « ouvert pour une page donnée » → il se ferme automatiquement dès que la page change (aucun effet nécessaire).
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const close = () => setOpenAt(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenAt(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={ref} className="flex flex-1">
      <button type="button" onClick={() => setOpenAt(open ? null : pathname)} aria-expanded={open} aria-controls="more-sheet"
        className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors", open ? "text-brand" : "text-navy/75 hover:text-navy")}>
        <Icon name={open ? "close" : "more"} className="size-6" strokeWidth={2.2} /><span>Plus</span>
      </button>
      {open && (
        <>
          <button type="button" aria-label="Fermer le menu" onClick={close} className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-[1px]" />
          <div id="more-sheet" role="dialog" aria-label="Autres pages" className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-50 max-h-[70vh] overflow-y-auto rounded-3xl bg-white p-3 shadow-2xl animate-fade-up">
            <div className="grid gap-1 sm:grid-cols-2">{items.map((i) => <NavLink key={i.href} {...i} variant="row" onNavigate={close} />)}</div>
            {children && <div className="mt-2 border-t border-navy/10 pt-2">{children}</div>}
          </div>
        </>
      )}
    </div>
  );
}
