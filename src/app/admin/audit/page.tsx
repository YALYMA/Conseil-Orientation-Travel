import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Journal d'audit", robots: { index: false } };
const PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireRole(["admin"]);
  const page = Math.max(0, Number.parseInt((await searchParams).page ?? "0", 10) || 0);
  const { data, error, count } = await (await createClient()).from("audit_logs").select("id, action, resource, created_at, metadata", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Journal d&apos;audit</h1>
      {error && <ErrorState message="Impossible de charger le journal." />}
      {!error && (data ?? []).length === 0 && <EmptyState title="Journal vide" text="Les actions sensibles (paiements, documents, rôles) seront listées ici." />}
      {(data ?? []).length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white" role="region" aria-label="Journal d'audit" tabIndex={0}>
          <table className="w-full min-w-[640px] text-sm"><thead className="bg-brand-soft text-left"><tr><th scope="col" className="p-3">Date</th><th scope="col" className="p-3">Action</th><th scope="col" className="p-3">Ressource</th><th scope="col" className="p-3">Détails</th></tr></thead>
            <tbody className="divide-y divide-navy/10">{data!.map((l) => (
              <tr key={l.id}><td className="p-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString("fr-FR")}</td><td className="p-3 font-medium">{l.action}</td><td className="p-3">{l.resource}</td><td className="p-3 text-xs text-navy/70">{Object.entries(l.metadata ?? {}).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}</td></tr>
            ))}</tbody></table>
        </div>
      )}
      {(count ?? 0) > PAGE && (
        <nav className="flex justify-between text-sm" aria-label="Pagination">
          {page > 0 ? <Link href={`?page=${page - 1}`} className="font-semibold text-brand">← Précédent</Link> : <span />}
          {(page + 1) * PAGE < (count ?? 0) && <Link href={`?page=${page + 1}`} className="font-semibold text-brand">Suivant →</Link>}
        </nav>
      )}
    </div>
  );
}
