import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getMyOrders, getMyNotifications } from "@/lib/data/student";
import { getOverview, type Overview } from "@/lib/data/overview";
import { DashboardView } from "@/components/student/DashboardView";

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

  return (
    <DashboardView
      firstName={(me.fullName ?? "").split(" ")[0] || ""}
      failed={failed}
      order={current ? { packName: current.service_packs?.name ?? "", status: current.status, price: current.price_total, first: current.first_amount, balance: current.balance_amount } : null}
      project={overview?.project ? { country: overview.project.countries?.name ?? null, level: overview.project.level, domain: overview.project.domain, year: overview.project.target_year } : null}
      progress={overview?.progress ?? null}
      notifications={notifications.map((n) => ({ id: n.id, title: n.title, body: n.body, read: !!n.read_at }))}
    />
  );
}
