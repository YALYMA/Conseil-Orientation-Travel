import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOverview } from "@/lib/data/overview";
import { ProgressTimeline } from "@/components/student/ProgressTimeline";
import { ProjectForm } from "@/components/student/ProjectForm";
import { MessageThread } from "@/components/student/MessageThread";
import { Card } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/EmptyState";
import { APPLICATION_LABELS, APPLICATION_TRANSITIONS, type ApplicationStatus } from "@/lib/applications/transitions";
import { ORDER_LABELS } from "@/lib/payments/labels";
import type { OrderStatus } from "@/lib/payments/workflow";
import { createApplication, moveApplication, createAppointment, setAppointmentStatus, setStep } from "@/app/advisor/dossier-actions";

export const metadata: Metadata = { title: "Dossier étudiant", robots: { index: false } };
const STEP_LABELS: Record<string, string> = { todo: "À faire", in_progress: "En cours", done: "Terminé" };
const fmt = (d: string) => new Date(d).toLocaleString("fr-FR", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" });

export default async function StudentFile({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const me = await requireRole(["advisor", "admin"]);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { ok, erreur } = await searchParams;
  const supabase = await createClient();

  // La RLS décide : un conseiller non assigné obtient « introuvable », pas « interdit ».
  const { data: st } = await supabase.from("students").select("id, profiles(full_name, phone)").eq("id", id).maybeSingle();
  if (!st) notFound();
  const profile = (st as unknown as { profiles: { full_name: string | null; phone: string | null } | null }).profiles;

  const [overview, orders, conv, countries] = await Promise.all([
    getOverview(id).catch(() => null),
    supabase.from("orders").select("id, reference, status, service_packs(name)").eq("student_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("conversations").select("id").eq("student_id", id).maybeSingle(),
    supabase.from("countries").select("id, name").eq("is_published", true).order("sort_order"),
  ]);
  const messages = conv.data ? (await supabase.from("messages").select("id, sender_id, body, created_at, read_at").eq("conversation_id", conv.data.id).order("created_at", { ascending: true }).limit(200)).data ?? [] : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><Link href="/advisor/etudiants" className="text-sm font-semibold text-brand">← Étudiants</Link>
        <h1 className="font-display mt-1 text-2xl font-extrabold">{profile?.full_name ?? "Étudiant"}</h1>
        {profile?.phone && <p className="text-sm text-navy/70">{profile.phone}</p>}</div>
      {ok && <p role="status" className="rounded-lg bg-[#dff5ea] p-3 text-sm font-medium text-[#0d7a50]">{ok.slice(0, 100)}</p>}
      {erreur && <ErrorState message={erreur.slice(0, 200)} />}
      {!overview && <ErrorState message="Impossible de charger le dossier." />}

      <Card>
        <h2 className="font-display text-lg font-bold">Commandes</h2>
        {(orders.data ?? []).length === 0 ? <p className="mt-2 text-sm text-navy/70">Aucune commande.</p> : (
          <ul className="mt-2 divide-y divide-navy/10 text-sm">{(orders.data as unknown as { id: string; reference: string; status: OrderStatus; service_packs: { name: string } | null }[]).map((o) => (
            <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2"><span>{o.reference} · Pack {o.service_packs?.name}</span><Badge tone="blue">{ORDER_LABELS[o.status].label}</Badge></li>
          ))}</ul>
        )}
        <Link href="/advisor/paiements" className="mt-2 inline-block text-sm font-semibold text-brand">Valider un paiement</Link>
      </Card>

      {overview && (
        <>
          <Card><h2 className="font-display text-lg font-bold">Progression</h2><div className="mt-3"><ProgressTimeline progress={overview.progress} /></div>
            {overview.project && (
              <div className="mt-4 flex flex-wrap gap-4 border-t border-navy/10 pt-4">
                {(["visa", "depart"] as const).map((code) => (
                  <form key={code} action={setStep} className="flex items-center gap-2"><input type="hidden" name="studentId" value={id} /><input type="hidden" name="code" value={code} />
                    <Select name="status" defaultValue={overview.steps[code] ?? "todo"} aria-label={code === "visa" ? "Étape visa" : "Étape départ"} className="w-36">{Object.entries(STEP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                    <Button type="submit" variant="outline">{code === "visa" ? "Visa" : "Départ"}</Button></form>
                ))}
              </div>
            )}
          </Card>

          <Card><h2 className="font-display text-lg font-bold">Projet</h2><div className="mt-3"><ProjectForm project={overview.project} studentId={id} /></div></Card>

          <Card>
            <h2 className="font-display text-lg font-bold">Candidatures</h2>
            {overview.applications.length === 0 && <p className="mt-2 text-sm text-navy/70">Aucune candidature.</p>}
            <div className="mt-3 space-y-4">
              {overview.applications.map((a) => {
                const next = APPLICATION_TRANSITIONS[a.status as ApplicationStatus] ?? [];
                return (
                  <div key={a.id} className="rounded-lg border border-navy/10 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{a.program_name}</p><p className="text-xs text-navy/60">{a.institution_name}{a.academic_year ? ` · ${a.academic_year}` : ""}</p></div>
                      <Badge tone="blue">{APPLICATION_LABELS[a.status as ApplicationStatus] ?? a.status}</Badge></div>
                    {a.application_events.length > 0 && <ul className="mt-2 space-y-0.5 text-xs text-navy/65">{[...a.application_events].sort((x, y) => y.created_at.localeCompare(x.created_at)).slice(0, 4).map((e) => <li key={e.id}>{new Date(e.created_at).toLocaleDateString("fr-FR")} — {e.label}</li>)}</ul>}
                    {next.length > 0 && (
                      <form action={moveApplication} className="mt-3 flex flex-wrap items-center gap-2"><input type="hidden" name="studentId" value={id} /><input type="hidden" name="id" value={a.id} />
                        <Select name="to" aria-label="Nouveau statut" className="w-56">{next.map((n) => <option key={n} value={n}>{APPLICATION_LABELS[n]}</option>)}</Select>
                        <Input name="note" maxLength={200} placeholder="Note (facultative)" aria-label="Note" className="w-56" /><Button type="submit" variant="outline">Mettre à jour</Button></form>
                    )}
                  </div>
                );
              })}
            </div>
            <form action={createApplication} className="mt-5 grid gap-3 border-t border-navy/10 pt-4 sm:grid-cols-2"><input type="hidden" name="studentId" value={id} />
              <Field label="Établissement" htmlFor="inst"><Input id="inst" name="institution" required minLength={2} maxLength={150} /></Field>
              <Field label="Formation" htmlFor="prog"><Input id="prog" name="program" required minLength={2} maxLength={150} /></Field>
              <Field label="Pays" htmlFor="cty"><Select id="cty" name="country"><option value="">À définir</option>{(countries.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
              <Field label="Année" htmlFor="yr"><Input id="yr" name="year" placeholder="2027-2028" maxLength={20} /></Field>
              <div className="sm:col-span-2"><Button type="submit">Ajouter une candidature</Button></div>
            </form>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-bold">Rendez-vous</h2>
            {overview.appointments.length === 0 && <p className="mt-2 text-sm text-navy/70">Aucun rendez-vous.</p>}
            <ul className="mt-3 space-y-3">{overview.appointments.map((ap) => (
              <li key={ap.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{fmt(ap.starts_at)} (UTC) · {ap.kind} · {ap.duration_minutes} min</span>
                <span className="flex items-center gap-2"><Badge tone="gray">{ap.status}</Badge>
                  {(["confirmed", "done", "cancelled", "no_show"] as const).filter((s) => s !== ap.status).map((s) => (
                    <form key={s} action={setAppointmentStatus}><input type="hidden" name="studentId" value={id} /><input type="hidden" name="id" value={ap.id} /><input type="hidden" name="status" value={s} /><button className="text-xs font-semibold text-brand underline">{s === "confirmed" ? "Confirmer" : s === "done" ? "Terminé" : s === "cancelled" ? "Annuler" : "Absent"}</button></form>
                  ))}</span></li>
            ))}</ul>
            <form action={createAppointment} className="mt-5 grid gap-3 border-t border-navy/10 pt-4 sm:grid-cols-2"><input type="hidden" name="studentId" value={id} />
              <Field label="Date et heure (UTC)" htmlFor="when"><Input id="when" name="when" type="datetime-local" required /></Field>
              <Field label="Durée (minutes)" htmlFor="dur"><Input id="dur" name="duration" type="number" min={10} max={180} defaultValue={30} required /></Field>
              <Field label="Type" htmlFor="kind"><Input id="kind" name="kind" defaultValue="Orientation" required minLength={2} maxLength={60} /></Field>
              <Field label="Lien de visioconférence (https://)" htmlFor="url"><Input id="url" name="url" maxLength={300} /></Field>
              <div className="sm:col-span-2"><Button type="submit">Créer le rendez-vous</Button></div>
            </form>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-bold">Documents</h2>
            {overview.documents.length === 0 ? <p className="mt-2 text-sm text-navy/70">Aucun document déposé.</p> : (
              <ul className="mt-2 divide-y divide-navy/10 text-sm">{overview.documents.map((d) => <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{d.name} <span className="text-navy/55">· {d.category}</span></span><span className="flex items-center gap-3"><StatusBadge status={d.status} /><a href={`/api/documents/${d.id}/download`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">Ouvrir</a></span></li>)}</ul>
            )}
            <Link href="/advisor/documents" className="mt-2 inline-block text-sm font-semibold text-brand">Vérifier les documents</Link>
          </Card>
        </>
      )}

      <Card><h2 className="font-display text-lg font-bold">Messages</h2>
        <div className="mt-3">{conv.data ? <MessageThread messages={messages} meId={me.id} conversationId={conv.data.id} back={`/advisor/etudiants/${id}`} /> : <p className="text-sm text-navy/70">Aucune conversation.</p>}</div></Card>
    </div>
  );
}
