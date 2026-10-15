import { requireRole } from "@/lib/auth/session";
import { signOut } from "@/app/(auth)/actions";
import { AppShell, type ShellItem } from "@/components/shell/AppShell";

const ITEMS: ShellItem[] = [
  { href: "/admin", label: "Tableau de bord", short: "Accueil", icon: "gauge", exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", short: "Utilisateurs", icon: "users" },
  { href: "/advisor/paiements", label: "Paiements et dossiers", short: "Paiements", icon: "wallet" },
  { href: "/admin/packs", label: "Packs", icon: "crown" },
  { href: "/admin/pays", label: "Pays et procédures", icon: "pin" },
  { href: "/admin/faq", label: "FAQ", icon: "chat" },
  { href: "/advisor/etudiants", label: "Dossiers étudiants", icon: "folder" },
  { href: "/advisor/documents", label: "Documents", icon: "file" },
  { href: "/admin/reglages", label: "Réglages", icon: "lock" },
  { href: "/admin/audit", label: "Journal d'audit", icon: "shield" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["admin"]);
  return <AppShell roleLabel="Administration" userName={me.fullName ?? me.email} items={ITEMS} tabs={["/admin", "/admin/utilisateurs", "/advisor/paiements", "/admin/packs"]} signOutAction={signOut}>{children}</AppShell>;
}
