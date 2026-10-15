import { NavLink } from "@/components/shell/NavLink";

/** Barre d'onglets du site public sur mobile (comportement d'application) : le test d'orientation est mis en avant au centre. */
export function PublicBottomNav() {
  return (
    <nav aria-label="Navigation rapide" className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-white/95 pb-safe shadow-[0_-8px_24px_-12px_rgba(6,59,112,.25)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl">
        <NavLink href="/" label="Accueil" icon="home" variant="tab" exact />
        <NavLink href="/pays" label="Pays" icon="pin" variant="tab" />
        <NavLink href="/orientation" label="Test" icon="compass" variant="fab" />
        <NavLink href="/packs" label="Packs" icon="crown" variant="tab" />
        <NavLink href="/connexion" label="Connexion" icon="user" variant="tab" />
      </div>
    </nav>
  );
}
