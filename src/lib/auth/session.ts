import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "advisor" | "admin";
export interface SessionProfile {
  id: string;
  email: string;
  role: Role;
  fullName: string | null;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser(); // vérifie le JWT auprès de Supabase
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", data.user.id)
    .single();
  if (!profile) return null;
  return { id: profile.id, email: data.user.email ?? "", role: profile.role as Role, fullName: profile.full_name };
}

const HOME: Record<Role, string> = { student: "/app/dashboard", advisor: "/advisor/dashboard", admin: "/admin" };
export const homeFor = (role: Role) => HOME[role];

/** Garde serveur : à appeler en tête de chaque page/action protégée. */
export async function requireRole(allowed: Role[]): Promise<SessionProfile> {
  const session = await getSessionProfile();
  if (!session) redirect("/connexion");
  if (!allowed.includes(session.role)) redirect(homeFor(session.role));
  return session;
}
