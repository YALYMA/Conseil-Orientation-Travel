import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStaffKpis } from "@/lib/data/staff";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

async function load() {
  try {
    const supabase = await createClient();
    const head = (t: string, role?: string) => { const q = supabase.from(t).select("id", { count: "exact", head: true }); return (role ? q.eq("role", role) : q).then((r) => r.count ?? 0); };
    const [kpis, students, advisors, orders] = await Promise.all([getStaffKpis(), head("profiles", "student"), head("profiles", "advisor"), head("orders")]);
    return { kpis, students, advisors, orders };
  } catch { return null; }
}

export default async function AdminHome() {
  const d = await load();
  if (!d) return <ErrorState message="Impossible de charger le tableau de bord." />;
  const cards: [string, number][] = [["Étudiants", d.students], ["Conseillers", d.advisors], ["Commandes", d.orders], ["Paiements à valider", d.kpis.toValidate], ["Dossiers actifs", d.kpis.active], ["Documents à vérifier", d.kpis.docs]];
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Tableau de bord administrateur</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([l, v]) => <Card key={l}><p className="text-sm text-navy/60">{l}</p><p className="text-3xl font-extrabold">{v}</p></Card>)}</div>
      <Card><p className="text-sm">Avant l&apos;ouverture au public, renseignez le <Link href="/admin/reglages" className="font-semibold text-brand">numéro Wave et WhatsApp</Link>.</p></Card>
    </div>
  );
}
