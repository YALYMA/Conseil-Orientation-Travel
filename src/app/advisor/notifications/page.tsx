import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationList } from "@/components/shared/NotificationList";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function Page() {
  await requireRole(["advisor", "admin"]);
  return (<div className="mx-auto max-w-3xl space-y-4"><h1 className="font-display text-2xl font-extrabold">Notifications</h1><NotificationList items={await getNotifications()} back="/advisor/notifications" /></div>);
}
