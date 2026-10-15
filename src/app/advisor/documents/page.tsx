import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { reviewDocument } from "@/app/advisor/doc-actions";
import { Flash } from "@/components/staff/Flash";

export const metadata: Metadata = { title: "Documents à vérifier", robots: { index: false } };

async function load() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, category, name, status, current_version, updated_at, students(profiles(full_name))")
    .in("status", ["uploaded", "in_review"])
    .order("updated_at", { ascending: true })
    .limit(30);
  return error ? null : (data as unknown as { id: string; category: string; name: string; status: string; current_version: number; students: { profiles: { full_name: string | null } | null } | null }[]);
}

export default async function StaffDocuments({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  await requireRole(["advisor", "admin"]);
  const { erreur } = await searchParams;
  const docs = await load();
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Documents à vérifier</h1>
      <Flash erreur={erreur} />
      {docs === null && <ErrorState message="Impossible de charger les documents." />}
      {docs?.length === 0 && <EmptyState title="Rien à vérifier" text="Les documents déposés par vos étudiants apparaîtront ici." />}
      {docs?.map((d) => (
        <Card key={d.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h2 className="font-semibold">{d.name}</h2><p className="text-xs text-navy/75">{d.students?.profiles?.full_name ?? "Étudiant"} · {d.category}</p></div>
            <StatusBadge status={d.status} />
          </div>
          <a href={`/api/documents/${d.id}/download`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand">Ouvrir le fichier (lien temporaire)</a>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={reviewDocument}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="status" value="validated" /><Button type="submit" variant="success">Valider</Button></form>
            {(["to_fix", "rejected"] as const).map((s) => (
              <form key={s} action={reviewDocument} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={d.id} /><input type="hidden" name="status" value={s} />
                <Input name="comment" required minLength={3} maxLength={500} placeholder="Motif (visible par l'étudiant)" aria-label={s === "to_fix" ? "Motif de correction" : "Motif de rejet"} className="w-60" />
                <Button type="submit" variant="outline">{s === "to_fix" ? "Demander une correction" : "Rejeter"}</Button>
              </form>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
