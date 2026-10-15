import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { setRole, assignAdvisor } from "@/app/admin/actions";
import { Flash } from "@/components/staff/Flash";

export const metadata: Metadata = { title: "Utilisateurs", robots: { index: false } };
const PAGE = 20;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string; page?: string }> }) {
  const me = await requireRole(["admin"]);
  const { ok, erreur, page: p } = await searchParams;
  const page = Math.max(0, Number.parseInt(p ?? "0", 10) || 0);
  const supabase = await createClient();
  const [users, advisors] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, is_active, students(advisor_id)", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1),
    supabase.from("profiles").select("id, full_name").eq("role", "advisor").eq("is_active", true),
  ]);
  const rows = (users.data ?? []) as unknown as { id: string; full_name: string | null; role: string; is_active: boolean; students: { advisor_id: string | null } | null }[];
  const total = users.count ?? 0;
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Utilisateurs</h1>
      <Flash ok={ok} erreur={erreur} />
      {users.error && <ErrorState message="Impossible de charger les utilisateurs." />}
      {!users.error && rows.length === 0 && <EmptyState title="Aucun utilisateur" text="Les comptes créés apparaîtront ici." />}
      {rows.map((u) => (
        <Card key={u.id}>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{u.full_name ?? "Sans nom"}{u.id === me.id && " (vous)"}</p><span className="text-xs text-navy/75">{u.role}</span></div>
          <div className="mt-3 flex flex-wrap gap-4">
            {u.id !== me.id && (
              <form action={setRole} className="flex items-center gap-2"><input type="hidden" name="user" value={u.id} />
                <Select name="role" defaultValue={u.role} aria-label={`Rôle de ${u.full_name ?? "l'utilisateur"}`} className="w-40"><option value="student">Étudiant</option><option value="advisor">Conseiller</option><option value="admin">Administrateur</option></Select>
                <Button type="submit" variant="outline">Changer le rôle</Button></form>
            )}
            {u.role === "student" && (
              <form action={assignAdvisor} className="flex items-center gap-2"><input type="hidden" name="student" value={u.id} />
                <Select name="advisor" defaultValue={u.students?.advisor_id ?? ""} aria-label={`Conseiller de ${u.full_name ?? "l'étudiant"}`} className="w-52"><option value="">Aucun conseiller</option>{(advisors.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.full_name ?? a.id.slice(0, 8)}</option>)}</Select>
                <Button type="submit" variant="outline">Assigner</Button></form>
            )}
          </div>
        </Card>
      ))}
      {total > PAGE && (
        <nav className="flex justify-between text-sm" aria-label="Pagination">
          {page > 0 ? <Link href={`?page=${page - 1}`} className="font-semibold text-brand">← Précédent</Link> : <span />}
          {(page + 1) * PAGE < total && <Link href={`?page=${page + 1}`} className="font-semibold text-brand">Suivant →</Link>}
        </nav>
      )}
    </div>
  );
}
