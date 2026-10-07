import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { signOut } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/app/dashboard", label: "Tableau de bord" },
  { href: "/app/projet", label: "Mon projet" },
  { href: "/app/candidatures", label: "Mes candidatures" },
  { href: "/app/documents", label: "Mes documents" },
  { href: "/app/paiements", label: "Mes paiements" },
  { href: "/app/rendez-vous", label: "Mes rendez-vous" },
  { href: "/app/messages", label: "Messages" },
  { href: "/app/commande", label: "Choisir un pack" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["student"]);
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="bg-navy text-white lg:w-64 lg:shrink-0">
        <div className="flex items-center justify-between px-4 py-3 lg:block lg:py-6">
          <Link href="/" className="font-display font-extrabold">Conseil-Orientation-Travel</Link>
          <p className="hidden text-sm text-white/70 lg:mt-1 lg:block">{me.fullName ?? me.email}</p>
        </div>
        <nav aria-label="Espace étudiant" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10">{l.label}</Link>)}
          <form action={signOut} className="lg:mt-6"><button className="min-h-11 rounded-lg px-3 text-sm text-white/80 hover:bg-white/10">Déconnexion</button></form>
        </nav>
      </aside>
      <main className="flex-1 bg-surface p-4 sm:p-8">{children}</main>
    </div>
  );
}
