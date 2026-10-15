import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getStaffKpis, getStaffOrders } from "@/lib/data/staff";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ORDER_LABELS } from "@/lib/payments/labels";
import { NEEDS_STAFF_ATTENTION } from "@/lib/payments/staff-actions";

export const metadata: Metadata = { title: "Tableau de bord conseiller", robots: { index: false } };

async function load() {
  try {
    const [kpis, { rows }] = await Promise.all([getStaffKpis(), getStaffOrders({ pageSize: 10 })]);
    return { kpis, todo: rows.filter((o) => NEEDS_STAFF_ATTENTION.includes(o.status)) };
  } catch {
    return null;
  }
}

export default async function AdvisorDashboard() {
  await requireRole(["advisor", "admin"]);
  const data = await load();
  if (!data) return <ErrorState message="Impossible de charger le tableau de bord." />;
  const { kpis, todo } = data;
  const cards: [string, number][] = [["Paiements à valider", kpis.toValidate], ["Dossiers actifs", kpis.active], ["Documents à vérifier", kpis.docs]];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Tableau de bord</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}><p className="text-sm text-navy/75">{label}</p><p className="text-3xl font-extrabold">{value}</p></Card>
        ))}
      </div>
      <Card>
        <h2 className="font-display text-lg font-bold">À traiter</h2>
        {todo.length === 0 ? (
          <div className="mt-3"><EmptyState title="Rien à traiter" text="Aucun paiement n'attend de validation." /></div>
        ) : (
          <ul className="mt-3 divide-y divide-navy/10">
            {todo.map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span>{o.students?.profiles?.full_name ?? "Étudiant"} · {o.service_packs?.name}</span>
                <span className="text-navy/75">{ORDER_LABELS[o.status].label}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/advisor/paiements" className="mt-3 inline-block text-sm font-semibold text-brand">Ouvrir les paiements et dossiers</Link>
      </Card>
    </div>
  );
}
