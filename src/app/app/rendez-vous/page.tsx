import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { respondAppointment } from "@/app/shared-actions";
import { Flash } from "@/components/staff/Flash";

export const metadata: Metadata = { title: "Mes rendez-vous", robots: { index: false } };
export const APPT_LABELS: Record<string, string> = { planned: "Planifié", confirmed: "Confirmé", done: "Terminé", cancelled: "Annulé", no_show: "Absent" };

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireRole(["student"]);
  const { ok, erreur } = await searchParams;
  const { data, error } = await (await createClient()).from("appointments").select("id, starts_at, duration_minutes, kind, status, meeting_url").order("starts_at", { ascending: false }).limit(30);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Mes rendez-vous</h1>
      <p className="text-sm text-navy/75">Les heures sont affichées à l&apos;heure de Dakar (GMT).</p>
      <Flash ok={ok} erreur={erreur} />
      {error && <ErrorState message="Impossible de charger vos rendez-vous." />}
      {!error && data?.length === 0 && <EmptyState title="Aucun rendez-vous" text="Votre conseiller planifiera vos rendez-vous ici. Vous pouvez aussi lui écrire dans Messages." />}
      {data?.map((a) => (
        <Card key={a.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h2 className="font-semibold capitalize">{a.kind}</h2><p className="text-sm">{new Date(a.starts_at).toLocaleString("fr-FR", { timeZone: "UTC", dateStyle: "full", timeStyle: "short" })} · {a.duration_minutes} min</p></div>
            <Badge tone={a.status === "confirmed" ? "green" : a.status === "cancelled" || a.status === "no_show" ? "red" : "blue"}>{APPT_LABELS[a.status]}</Badge>
          </div>
          {a.meeting_url && a.status !== "cancelled" && <ButtonLink href={a.meeting_url} external variant="outline" className="mt-3">Rejoindre</ButtonLink>}
          {(a.status === "planned" || a.status === "confirmed") && new Date(a.starts_at) > new Date() && (
            <div className="mt-3 flex gap-2">
              {a.status === "planned" && <form action={respondAppointment}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value="confirmed" /><Button type="submit" variant="success">Confirmer</Button></form>}
              <form action={respondAppointment}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value="cancelled" /><Button type="submit" variant="outline">Annuler</Button></form>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
