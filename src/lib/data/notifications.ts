import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface NotificationRow { id: string; kind: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }

/** RLS : chaque utilisateur ne lit que ses propres notifications. */
export async function getNotifications(limit = 50): Promise<NotificationRow[] | null> {
  const { data, error } = await (await createClient()).from("notifications").select("id, kind, title, body, link, read_at, created_at").order("created_at", { ascending: false }).limit(limit);
  return error ? null : (data as NotificationRow[]);
}

export async function getUnreadCount(): Promise<number> {
  try {
    const { count } = await (await createClient()).from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    return count ?? 0;
  } catch { return 0; }
}
