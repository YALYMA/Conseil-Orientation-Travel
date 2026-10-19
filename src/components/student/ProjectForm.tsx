import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import { saveProject } from "@/app/app/actions";
import type { Overview } from "@/lib/data/overview";

const BUDGETS = ["Moins de 2.000.000 FCFA", "2 à 4.000.000 FCFA", "4 à 6.000.000 FCFA", "Plus de 6.000.000 FCFA", "Je ne sais pas"];

export async function ProjectForm({ project, studentId }: { project: Overview["project"]; studentId?: string }) {
  const supabase = await createClient();
  const [c, l, d] = await Promise.all([
    supabase.from("countries").select("id, name").eq("is_published", true).order("sort_order"),
    supabase.from("study_levels").select("code, label").order("sort_order"),
    supabase.from("domains").select("code, label").order("sort_order"),
  ]);
  const key = studentId ?? "me";
  return (
    <form action={saveProject} className="space-y-4">
      {studentId && <input type="hidden" name="studentId" value={studentId} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pays visé" htmlFor={`country-${key}`}><Select id={`country-${key}`} name="country" defaultValue={project?.country_id ?? ""}><option value="">À définir</option>{(c.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
        <Field label="Niveau" htmlFor={`level-${key}`}><Select id={`level-${key}`} name="level" defaultValue={project?.level ?? "licence"} required>{(l.data ?? []).map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}</Select></Field>
        <Field label="Domaine" htmlFor={`domain-${key}`}><Select id={`domain-${key}`} name="domain" defaultValue={project?.domain ?? "informatique"} required>{(d.data ?? []).map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}</Select></Field>
        <Field label="Année souhaitée" htmlFor={`year-${key}`}><Input id={`year-${key}`} name="year" type="number" min={2026} max={2035} required defaultValue={project?.target_year ?? 2027} /></Field>
        <Field label="Budget annuel" htmlFor={`budget-${key}`}><Select id={`budget-${key}`} name="budget" defaultValue={project?.budget_range ?? "Je ne sais pas"}>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</Select></Field>
      </div>
      <Field label="Objectif professionnel" htmlFor={`goal-${key}`}><Textarea id={`goal-${key}`} name="goal" maxLength={500} defaultValue={project?.career_goal ?? ""} /></Field>
      <Button type="submit">Enregistrer le projet</Button>
    </form>
  );
}
