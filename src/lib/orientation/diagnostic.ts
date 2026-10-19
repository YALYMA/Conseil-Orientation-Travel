import type { Question } from "./questions";

export type Answers = Partial<Record<string, string | string[]>>;
export interface Diagnostic {
  profile: { label: string; value: string }[];
  recommendations: string[];
  notes: string[];
  suggestedPack: "orientation" | "audit-correction" | "candidature" | "premium";
}

const str = (a: Answers, k: string) => (Array.isArray(a[k]) ? (a[k] as string[]).join(", ") : (a[k] as string | undefined)?.trim() ?? "");

/** Valide les réponses : toute question à choix doit contenir une option connue. */
export function validateAnswers(answers: Answers, questions: Question[]): string[] {
  const errors: string[] = [];
  for (const q of questions) {
    const v = answers[q.code];
    if (q.code === "project") continue; // champ libre facultatif
    if (v === undefined || (Array.isArray(v) ? v.length === 0 : v === "")) { errors.push(`Réponse manquante : ${q.label}`); continue; }
    if (q.kind === "single" && !q.options?.includes(v as string)) errors.push(`Valeur invalide : ${q.code}`);
    if (q.kind === "multi" && !(v as string[]).every((x) => q.options?.includes(x))) errors.push(`Valeur invalide : ${q.code}`);
    if (q.kind === "number") {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 2026 || n > 2035) errors.push("Année invalide.");
    }
  }
  return errors;
}

/** Diagnostic indicatif. Ne promet JAMAIS d'admission ni de visa. */
export function buildDiagnostic(a: Answers): Diagnostic {
  const level = str(a, "level"), goal = str(a, "goal"), dest = str(a, "destination");
  const langs = Array.isArray(a.languages) ? (a.languages as string[]) : [];
  const undecided = dest === "Je ne sais pas encore";

  const profile = [
    { label: "Niveau", value: level }, { label: "Domaine", value: str(a, "domain") },
    { label: "Destination privilégiée", value: dest }, { label: "Objectif", value: goal },
    { label: "Année souhaitée", value: str(a, "year") }, { label: "Budget annuel", value: str(a, "budget") },
    { label: "Langues", value: langs.join(", ") },
  ].filter((p) => p.value);

  const recommendations = [
    `Étudier les formations en ${str(a, "domain").toLowerCase() || "lien avec votre domaine"}`,
    "Vérifier les conditions d'admission sur les sites officiels",
    "Préparer votre dossier (CV, relevés, lettre de motivation)",
    "Sélectionner plusieurs formations plutôt qu'une seule",
  ];
  if (undecided) recommendations.unshift("Comparer plusieurs destinations avant de choisir");

  const notes: string[] = [];
  const order = ["Bac", "Licence", "Master", "Doctorat"];
  if (order.indexOf(goal) > -1 && order.indexOf(level) > -1 && order.indexOf(goal) <= order.indexOf(level) && goal !== level)
    notes.push("Votre objectif semble de niveau inférieur ou égal à votre niveau actuel : un conseiller peut vous aider à préciser le bon parcours.");
  if (goal === "Master" && level === "Bac") notes.push("Un Master suppose en général un diplôme de Licence : à clarifier avec un conseiller.");
  if (dest === "Italie" && !langs.includes("Italien")) notes.push("Vérifiez la langue d'enseignement des formations visées et les exigences linguistiques.");
  if (dest === "France" && !langs.includes("Français")) notes.push("Vérifiez la langue d'enseignement des formations visées et les exigences linguistiques.");
  if (str(a, "budget") === "Moins de 2.000.000 FCFA") notes.push("Le budget est un critère important : un conseiller vous aidera à comparer les options.");

  const suggestedPack = undecided || level === "Bac" ? "orientation" : "candidature";
  return { profile, recommendations, notes, suggestedPack };
}
