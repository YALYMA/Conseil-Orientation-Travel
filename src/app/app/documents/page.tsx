import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { DocumentUploader } from "@/components/student/DocumentUploader";

export const metadata: Metadata = { title: "Mes documents", robots: { index: false } };

async function load() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, category, name, status, advisor_comment, current_version, updated_at, document_versions(version, size_bytes, created_at)")
    .order("updated_at", { ascending: false })
    .limit(50);
  return error ? null : data;
}

export default async function DocumentsPage() {
  await requireRole(["student"]);
  const docs = await load();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Mes documents</h1>
      <p className="text-sm text-navy/70">Déposez vos documents ici, jamais par WhatsApp. Ils sont privés : seuls vous et votre conseiller y avez accès.</p>
      {docs === null && <ErrorState message="Impossible de charger vos documents." />}
      {docs?.length === 0 && <EmptyState title="Aucun document" text="Ajoutez votre CV, vos relevés de notes ou votre passeport pour que votre conseiller puisse les vérifier." />}
      {docs?.map((d) => {
        const v = d.document_versions.find((x) => x.version === d.current_version);
        return (
          <Card key={d.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h2 className="font-semibold">{d.name}</h2><p className="text-xs text-navy/60">{d.category}{v ? ` · v${v.version} · ${(v.size_bytes / 1024).toFixed(0)} Ko · ${new Date(v.created_at).toLocaleDateString("fr-FR")}` : ""}</p></div>
              <StatusBadge status={d.status} />
            </div>
            {d.advisor_comment && <p className="mt-3 rounded-lg bg-[#fff4d6] p-3 text-sm"><strong>Commentaire du conseiller :</strong> {d.advisor_comment}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {d.current_version > 0 && <a href={`/api/documents/${d.id}/download`} className="font-semibold text-brand" target="_blank" rel="noopener noreferrer">Ouvrir le fichier</a>}
            </div>
            {d.status !== "validated" && (
              <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-brand">Remplacer par une nouvelle version</summary>
                <div className="mt-3"><DocumentUploader documentId={d.id} maxMb={publicEnv.storageMaxMb} defaultCategory={d.category} defaultName={d.name} /></div></details>
            )}
          </Card>
        );
      })}
      <Card><h2 className="font-display text-lg font-bold">Ajouter un document</h2><div className="mt-3"><DocumentUploader maxMb={publicEnv.storageMaxMb} /></div></Card>
    </div>
  );
}
