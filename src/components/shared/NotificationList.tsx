import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { markAllNotificationsRead } from "@/app/shared-actions";
import { safeNext } from "@/lib/validators/auth";
import type { NotificationRow } from "@/lib/data/notifications";

export function NotificationList({ items, back }: { items: NotificationRow[] | null; back: string }) {
  if (!items) return <ErrorState message="Impossible de charger vos notifications." />;
  if (items.length === 0) return <EmptyState title="Aucune notification" text="Vous serez averti ici des paiements, documents, rendez-vous et messages." />;
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <div className="space-y-4">
      {unread > 0 && <form action={markAllNotificationsRead}><input type="hidden" name="back" value={back} /><Button type="submit" variant="outline">Tout marquer comme lu ({unread})</Button></form>}
      <ul className="space-y-3">
        {items.map((n) => {
          const link = n.link ? safeNext(n.link) : null; // défense en profondeur : uniquement un chemin interne
          return (
            <li key={n.id}>
              <Card className={n.read_at ? "" : "border-brand"}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className={n.read_at ? "font-medium" : "font-bold"}>{!n.read_at && <span className="mr-2 inline-block size-2 rounded-full bg-brand align-middle" aria-hidden />}{n.title}{!n.read_at && <span className="sr-only"> (non lue)</span>}</p>
                  <time className="text-xs text-navy/75" dateTime={n.created_at}>{new Date(n.created_at).toLocaleString("fr-FR", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" })}</time>
                </div>
                {n.body && <p className="mt-1 break-words text-sm text-navy/75">{n.body}</p>}
                {link && <Link href={link} className="mt-2 inline-block text-sm font-semibold text-brand">Ouvrir</Link>}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
