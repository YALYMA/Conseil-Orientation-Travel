import { requireRole } from "@/lib/auth/session";
import { signOut } from "@/app/(auth)/actions";
import { AppShell, type ShellItem } from "@/components/shell/AppShell";

const ITEMS: ShellItem[] = [
  { href: "/app/dashboard", label: "Tableau de bord", short: "Accueil", icon: "home" },
  { href: "/app/candidatures", label: "Mes candidatures", short: "Candidatures", icon: "send" },
  { href: "/app/documents", label: "Mes documents", short: "Documents", icon: "folder" },
  { href: "/app/messages", label: "Messages", icon: "chat" },
  { href: "/app/projet", label: "Mon projet", icon: "compass" },
  { href: "/app/paiements", label: "Mes paiements", icon: "wallet" },
  { href: "/app/rendez-vous", label: "Mes rendez-vous", icon: "calendar" },
  { href: "/app/notifications", label: "Notifications", icon: "bell" },
  { href: "/app/commande", label: "Choisir un pack", icon: "sparkles" },
  { href: "/app/profil", label: "Mon profil", icon: "user" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["student"]);
  return <AppShell roleLabel="Espace étudiant" userName={me.fullName ?? me.email} items={ITEMS} tabs={["/app/dashboard", "/app/candidatures", "/app/documents", "/app/messages"]} signOutAction={signOut}>{children}</AppShell>;
}
