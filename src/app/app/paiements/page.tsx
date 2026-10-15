import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getMyOrders, getPublicSettings } from "@/lib/data/student";
import { createClient } from "@/lib/supabase/server";
import { PaymentCard } from "@/components/student/PaymentCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Flash } from "@/components/staff/Flash";

export const metadata: Metadata = { title: "Mes paiements", robots: { index: false } };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const me = await requireRole(["student"]);
  const { erreur } = await searchParams;
  const supabase = await createClient();
  const [{ data: profile }, settings] = await Promise.all([supabase.from("profiles").select("phone").eq("id", me.id).single(), getPublicSettings()]);
  let orders: Awaited<ReturnType<typeof getMyOrders>> = [];
  let failed = false;
  try { orders = await getMyOrders(); } catch { failed = true; }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Mes paiements</h1>
      <Flash erreur={erreur} />
      {failed && <ErrorState message="Impossible de charger vos paiements. Réessayez dans un instant." />}
      {!failed && orders.length === 0 && <EmptyState title="Aucune commande" text="Choisissez un pack pour démarrer." action={<ButtonLink href="/app/commande" variant="cta">Choisir un pack</ButtonLink>} />}
      {orders.map((o) => <PaymentCard key={o.id} order={o} settings={settings} student={{ fullName: me.fullName ?? "", phone: profile?.phone ?? "" }} />)}
    </div>
  );
}
