import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { signOut } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/admin", label: "Tableau de bord" }, { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/admin/packs", label: "Packs" }, { href: "/admin/pays", label: "Pays et procédures" }, { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/reglages", label: "Réglages" }, { href: "/admin/audit", label: "Journal d'audit" },
  { href: "/advisor/etudiants", label: "Dossiers étudiants" }, { href: "/advisor/paiements", label: "Paiements et dossiers" }, { href: "/advisor/documents", label: "Documents" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["admin"]);
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="bg-navy text-white lg:w-64 lg:shrink-0">
        <div className="px-4 py-3 lg:py-6"><Link href="/" className="font-display font-extrabold">Conseil-Orientation-Travel</Link><p className="mt-1 hidden text-sm text-white/70 lg:block">Administration · {me.fullName ?? me.email}</p></div>
        <nav aria-label="Administration" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10">{l.label}</Link>)}
          <form action={signOut} className="lg:mt-6"><button className="min-h-11 rounded-lg px-3 text-sm text-white/80 hover:bg-white/10">Déconnexion</button></form>
        </nav>
      </aside>
      <main className="flex-1 bg-surface p-4 sm:p-8">{children}</main>
    </div>
  );
}
