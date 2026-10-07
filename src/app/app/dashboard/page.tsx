import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getMyOrders, getMyNotifications } from "@/lib/data/student";
import { getOverview, type Overview } from "@/lib/data/overview";
import { ProgressTimeline } from "@/components/student/ProgressTimeline";
import { ORDER_LABELS } from "@/lib/payments/labels";
import { formatFcfa } from "@/lib/payments/split";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Tableau de bord", robots: { index: false } };

export default async function DashboardPage() {
  const me = await requireRole(["student"]);
  let orders: Awaited<ReturnType<typeof getMyOrders>> = [];
  let failed = false;
  try { orders = await getMyOrders(); } catch { failed = true; }
  const notifications = await getMyNotifications();
  let overview: Overview | null = null;
  try { overview = await getOverview(me.id); } catch { overview = null; }
  const current = orders.find((o) => !["CANCELLED", "COMPLETED"].includes(o.status)) ?? orders[0];
  const firstName = (me.fullName ?? "").split(" ")[0] || "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Bonjour {firstName} 👋</h1>
      {failed && <ErrorState message="Impossible de charger vos informations. Réessayez dans un instant." />}

      {!failed && !current && (
        <EmptyState title="Vous n'avez pas encore de pack" text="Choisissez un pack pour démarrer votre accompagnement. Vous ne payez que 50 % pour commencer."
          action={<ButtonLink href="/app/commande" variant="cta">Choisir un pack</ButtonLink>} />
      )}

      {current && (
        <Card>
          <p className="text-sm text-navy/60">Mon accompagnement</p>
          <h2 className="font-display text-xl font-bold">Pack {current.service_packs?.name}</h2>
          <p className="mt-1 font-semibold text-brand">{ORDER_LABELS[current.status].label}</p>
          <p className="mt-2 text-sm text-navy/75">{ORDER_LABELS[current.status].next}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-navy/60">Prix total</dt><dd className="font-bold">{formatFcfa(current.price_total)}</dd></div>
            <div><dt className="text-navy/60">Premier paiement</dt><dd className="font-bold">{formatFcfa(current.first_amount)}</dd></div>
            <div><dt className="text-navy/60">Solde</dt><dd className="font-bold">{formatFcfa(current.balance_amount)}</dd></div>
          </dl>
          <Link href="/app/paiements" className="mt-4 inline-block text-sm font-semibold text-brand">Voir mes paiements</Link>
        </Card>
      )}

      {overview && (
        <Card>
          <h2 className="font-display text-lg font-bold">Mon projet</h2>
          {overview.project ? (
            <p className="mt-1 text-sm text-navy/75">{overview.project.countries?.name ?? "Pays à définir"} · {overview.project.level} · {overview.project.domain}{overview.project.target_year ? ` · ${overview.project.target_year}` : ""}</p>
          ) : (
            <p className="mt-1 text-sm text-navy/75">Votre projet n&apos;est pas encore défini. <Link href="/app/projet" className="font-semibold text-brand">Le renseigner</Link></p>
          )}
          <div className="mt-4"><ProgressTimeline progress={overview.progress} /></div>
        </Card>
      )}

      <Card>
        <h2 className="font-display text-lg font-bold">Notifications récentes</h2>
        {notifications.length === 0 ? <p className="mt-2 text-sm text-navy/70">Aucune notification pour le moment.</p> : (
          <ul className="mt-3 divide-y divide-navy/10">{notifications.map((n) => (
            <li key={n.id} className="py-2 text-sm"><p className={n.read_at ? "" : "font-semibold"}>{n.title}</p>{n.body && <p className="text-navy/65">{n.body}</p>}</li>
          ))}</ul>
        )}
      </Card>
    </div>
  );
}
