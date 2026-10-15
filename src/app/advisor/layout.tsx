import { requireRole } from "@/lib/auth/session";
import { signOut } from "@/app/(auth)/actions";
import { AppShell, type ShellItem } from "@/components/shell/AppShell";

const ITEMS: ShellItem[] = [
  { href: "/advisor/dashboard", label: "Tableau de bord", short: "Accueil", icon: "home" },
  { href: "/advisor/etudiants", label: "Étudiants", icon: "users" },
  { href: "/advisor/paiements", label: "Paiements et dossiers", short: "Paiements", icon: "wallet" },
  { href: "/advisor/documents", label: "Documents", icon: "folder" },
  { href: "/advisor/notifications", label: "Notifications", icon: "bell" },
];

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["advisor", "admin"]);
  return <AppShell roleLabel="Espace conseiller" userName={me.fullName ?? me.email} items={ITEMS} tabs={["/advisor/dashboard", "/advisor/etudiants", "/advisor/paiements", "/advisor/documents"]} signOutAction={signOut}>{children}</AppShell>;
}
