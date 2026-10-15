import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ORDER_LABELS } from "@/lib/payments/labels";
import type { OrderStatus } from "@/lib/payments/workflow";

export const metadata: Metadata = { title: "Étudiants", robots: { index: false } };
const PAGE = 20;

interface Row { id: string; profiles: { full_name: string | null } | null; orders: { status: OrderStatus; service_packs: { name: string } | null }[] }

async function load(page: number) {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("students")
    .select("id, profiles(full_name), orders(status, service_packs(name))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1);
  return error ? null : { rows: (data ?? []) as unknown as Row[], total: count ?? 0 };
}

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireRole(["advisor", "admin"]);
  const page = Math.max(0, Number.parseInt((await searchParams).page ?? "0", 10) || 0);
  const data = await load(page);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Étudiants</h1>
      {!data && <ErrorState message="Impossible de charger les étudiants." />}
      {data && data.rows.length === 0 && <EmptyState title="Aucun étudiant" text="Les étudiants qui vous sont assignés apparaîtront ici." />}
      {data?.rows.map((s) => {
        const o = s.orders.find((x) => !["CANCELLED", "COMPLETED"].includes(x.status)) ?? s.orders[0];
        return (
          <Card key={s.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-semibold">{s.profiles?.full_name ?? "Sans nom"}</p><p className="text-xs text-navy/75">{o ? `Pack ${o.service_packs?.name}` : "Aucun pack"}</p></div>
              <div className="flex items-center gap-3">{o && <Badge tone="blue">{ORDER_LABELS[o.status].label}</Badge>}<Link href={`/advisor/etudiants/${s.id}`} className="text-sm font-semibold text-brand">Ouvrir le dossier<span className="sr-only"> de {s.profiles?.full_name ?? "l'étudiant"}</span></Link></div>
            </div>
          </Card>
        );
      })}
      {data && data.total > PAGE && (
        <nav className="flex justify-between text-sm" aria-label="Pagination">
          {page > 0 ? <Link href={`?page=${page - 1}`} className="font-semibold text-brand">← Précédent</Link> : <span />}
          {(page + 1) * PAGE < data.total && <Link href={`?page=${page + 1}`} className="font-semibold text-brand">Suivant →</Link>}
        </nav>
      )}
    </div>
  );
}
