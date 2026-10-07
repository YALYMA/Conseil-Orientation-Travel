import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/payments/workflow";

export interface PaymentRow { stage: "initial" | "balance"; amount: number; status: string; rejection_reason: string | null }
export interface OrderRow {
  id: string; reference: string; status: OrderStatus; status_reason: string | null;
  price_total: number; first_amount: number; balance_amount: number; created_at: string;
  service_packs: { name: string; slug: string } | null;
  countries: { name: string } | null;
  payments: PaymentRow[];
}
export interface Settings { wave: { display_name?: string; phone?: string; payment_url?: string; instructions?: string }; whatsapp: { phone?: string; business_url?: string } }

/** Toutes ces lectures passent par la RLS : un étudiant ne reçoit que ses propres lignes. */
export async function getMyOrders(): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, reference, status, status_reason, price_total, first_amount, balance_amount, created_at, service_packs(name, slug), countries(name), payments(stage, amount, status, rejection_reason)")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("Impossible de charger vos commandes.");
  return (data ?? []) as unknown as OrderRow[];
}

export async function getPublicSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value").in("key", ["wave", "whatsapp"]);
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return { wave: map.wave ?? {}, whatsapp: map.whatsapp ?? {} };
}

export async function getMyNotifications(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id, title, body, read_at, created_at").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function getActivePacks() {
  const supabase = await createClient();
  const { data } = await supabase.from("service_packs").select("slug, name, tagline, price_total, badge").eq("is_active", true).order("sort_order");
  return data ?? [];
}
