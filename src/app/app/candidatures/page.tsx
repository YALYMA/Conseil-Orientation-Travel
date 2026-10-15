import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { APPLICATION_LABELS, type ApplicationStatus } from "@/lib/applications/transitions";

export const metadata: Metadata = { title: "Mes candidatures", robots: { index: false } };
const tone = (s: ApplicationStatus) => (s === "ACCEPTED" ? "green" : s === "REFUSED" || s === "WITHDRAWN" ? "red" : s === "SUBMITTED" || s === "WAITING" ? "blue" : "gray") as "green" | "red" | "blue" | "gray";

export default async function ApplicationsPage() {
  await requireRole(["student"]);
  const { data, error } = await (await createClient()).from("applications")
    .select("id, institution_name, program_name, academic_year, status, submission_date, countries(name), application_events(id, label, status, created_at)")
    .order("created_at", { ascending: false }).limit(30);
  const apps = (data ?? []) as unknown as { id: string; institution_name: string | null; program_name: string | null; academic_year: string | null; status: ApplicationStatus; submission_date: string | null; countries: { name: string } | null; application_events: { id: string; label: string; created_at: string }[] }[];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Mes candidatures</h1>
      <p className="text-sm text-navy/75">La décision finale appartient aux établissements et aux autorités compétentes.</p>
      {error && <ErrorState message="Impossible de charger vos candidatures." />}
      {!error && apps.length === 0 && <EmptyState title="Aucune candidature pour le moment" text="Votre conseiller ajoutera ici les formations retenues, puis vous pourrez suivre chaque étape." />}
      {apps.map((a) => (
        <Card key={a.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h2 className="font-semibold">{a.program_name}</h2><p className="text-sm text-navy/75">{a.institution_name}{a.countries ? ` · ${a.countries.name}` : ""}{a.academic_year ? ` · ${a.academic_year}` : ""}</p></div>
            <Badge tone={tone(a.status)}>{APPLICATION_LABELS[a.status]}</Badge>
          </div>
          <ol className="mt-3 space-y-1 border-l-2 border-brand-soft pl-3 text-sm">
            {[...a.application_events].sort((x, y) => y.created_at.localeCompare(x.created_at)).map((e) => (
              <li key={e.id}><span className="text-navy/75">{new Date(e.created_at).toLocaleDateString("fr-FR", { timeZone: "UTC" })}</span> · {APPLICATION_LABELS[e.label as ApplicationStatus] ?? e.label}</li>
            ))}
          </ol>
        </Card>
      ))}
    </div>
  );
}
