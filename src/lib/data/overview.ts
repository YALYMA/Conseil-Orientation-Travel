import "server-only";
import { createClient } from "@/lib/supabase/server";
import { computeProgress } from "@/lib/progress";

export interface Overview {
  project: { country_id: string | null; level: string | null; domain: string | null; target_year: number | null; career_goal: string | null; budget_range: string | null; countries: { name: string } | null } | null;
  steps: Record<string, string>;
  documents: { id: string; category: string; name: string; status: string }[];
  applications: { id: string; institution_name: string | null; program_name: string | null; academic_year: string | null; status: string; application_events: { id: string; label: string; created_at: string }[] }[];
  appointments: { id: string; starts_at: string; duration_minutes: number; kind: string; status: string; meeting_url: string | null }[];
  progress: ReturnType<typeof computeProgress>;
}

/** Tout passe par la RLS : un étudiant lit le sien, un conseiller ses étudiants, un admin tout. */
export async function getOverview(studentId: string): Promise<Overview> {
  const supabase = await createClient();
  const [proj, docs, apps, appts] = await Promise.all([
    supabase.from("student_projects").select("country_id, level, domain, target_year, career_goal, budget_range, countries(name), project_steps(code, status)").eq("student_id", studentId).maybeSingle(),
    supabase.from("documents").select("id, category, name, status").eq("student_id", studentId).limit(100),
    supabase.from("applications").select("id, institution_name, program_name, academic_year, status, application_events(id, label, created_at)").eq("student_id", studentId).order("created_at", { ascending: false }).limit(50),
    supabase.from("appointments").select("id, starts_at, duration_minutes, kind, status, meeting_url").eq("student_id", studentId).order("starts_at", { ascending: true }).limit(50),
  ]);
  if (proj.error || docs.error || apps.error || appts.error) throw new Error("Impossible de charger le dossier.");

  const raw = proj.data as unknown as (Overview["project"] & { project_steps: { code: string; status: string }[] }) | null;
  const steps = Object.fromEntries((raw?.project_steps ?? []).map((s) => [s.code, s.status]));
  const project = raw ? { ...raw } : null;
  const documents = docs.data ?? [];
  const applications = (apps.data ?? []) as unknown as Overview["applications"];
  const appointments = appts.data ?? [];
  const progress = computeProgress({
    profileComplete: !!(project?.country_id && project.level && project.domain),
    documents, applications, appointments,
    manual: raw ? { visa: steps.visa, depart: steps.depart } : undefined,
  });
  return { project, steps, documents, applications, appointments, progress };
}
