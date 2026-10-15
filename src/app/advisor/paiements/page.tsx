import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getStaffOrders } from "@/lib/data/staff";
import { OrderRowCard } from "@/components/staff/OrderRowCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Flash } from "@/components/staff/Flash";

export const metadata: Metadata = { title: "Paiements et dossiers", robots: { index: false } };
const PAGE_SIZE = 20;

export default async function StaffPayments({ searchParams }: { searchParams: Promise<{ erreur?: string; page?: string }> }) {
  const me = await requireRole(["advisor", "admin"]);
  const { erreur, page: p } = await searchParams;
  const page = Math.max(0, Number.parseInt(p ?? "0", 10) || 0);
  let data: Awaited<ReturnType<typeof getStaffOrders>> | null = null;
  try { data = await getStaffOrders({ page, pageSize: PAGE_SIZE }); } catch { data = null; }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Paiements et dossiers</h1>
      <p className="text-sm text-navy/75">Un paiement n&apos;est validé qu&apos;après vérification de la preuve reçue sur WhatsApp. Chaque action est journalisée.</p>
      <Flash erreur={erreur} />
      {!data && <ErrorState message="Impossible de charger les commandes." />}
      {data && data.rows.length === 0 && <EmptyState title="Aucune commande en cours" text="Les nouvelles commandes de vos étudiants apparaîtront ici." />}
      {data?.rows.map((o) => <OrderRowCard key={o.id} order={o} role={me.role as "advisor" | "admin"} />)}
      {data && data.total > PAGE_SIZE && (
        <nav className="flex justify-between text-sm" aria-label="Pagination">
          {page > 0 ? <Link href={`?page=${page - 1}`} className="font-semibold text-brand">← Précédent</Link> : <span />}
          {(page + 1) * PAGE_SIZE < data.total && <Link href={`?page=${page + 1}`} className="font-semibold text-brand">Suivant →</Link>}
        </nav>
      )}
    </div>
  );
}
