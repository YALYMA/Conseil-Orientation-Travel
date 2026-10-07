import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/payments/workflow";

export interface StaffOrder {
  id: string; reference: string; status: OrderStatus; status_reason: string | null;
  price_total: number; first_amount: number; balance_amount: number; updated_at: string;
  service_packs: { name: string } | null;
  students: { profiles: { full_name: string | null; phone: string | null } | null } | null;
  payments: { stage: string; status: string; payment_proofs: { wave_reference: string | null; created_at: string }[] }[];
}

/** La RLS limite déjà le résultat : conseiller = ses étudiants, admin = tous. Pagination obligatoire. */
export async function getStaffOrders(opts: { onlyOpen?: boolean; page?: number; pageSize?: number } = {}) {
  const { onlyOpen = true, page = 0, pageSize = 20 } = opts;
  const supabase = await createClient();
  let q = supabase
    .from("orders")
    .select("id, reference, status, status_reason, price_total, first_amount, balance_amount, updated_at, service_packs(name), students(profiles(full_name, phone)), payments(stage, status, payment_proofs(wave_reference, created_at))", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);
  if (onlyOpen) q = q.not("status", "in", "(COMPLETED,CANCELLED)");
  const { data, error, count } = await q;
  if (error) throw new Error("Impossible de charger les commandes.");
  return { rows: (data ?? []) as unknown as StaffOrder[], total: count ?? 0 };
}

export async function getStaffKpis() {
  const supabase = await createClient();
  const count = async (build: (q: ReturnType<typeof supabase.from>) => unknown) => {
    const res = (await build(supabase.from("orders"))) as { count: number | null };
    return res.count ?? 0;
  };
  const [toValidate, active, docs] = await Promise.all([
    count((q) => q.select("id", { count: "exact", head: true }).in("status", ["FIRST_PAYMENT_PROOF_SUBMITTED", "FIRST_PAYMENT_UNDER_REVIEW", "BALANCE_PROOF_SUBMITTED"])),
    count((q) => q.select("id", { count: "exact", head: true }).in("status", ["SERVICE_ACTIVE", "SERVICE_IN_PROGRESS", "SERVICE_READY_FOR_FINAL_PAYMENT"])),
    supabase.from("documents").select("id", { count: "exact", head: true }).in("status", ["uploaded", "in_review"]).then((r) => r.count ?? 0),
  ]);
  return { toValidate, active, docs };
}
