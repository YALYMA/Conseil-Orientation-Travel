/** Questionnaire de repli (aligné sur supabase/seed.sql, table orientation_questions). */
export type Kind = "single" | "multi" | "text" | "number";
export interface Question { code: string; label: string; kind: Kind; options?: string[] }

export const QUESTIONS: Question[] = [
  { code: "level", label: "Quel est votre niveau actuel ?", kind: "single", options: ["Bac", "Licence", "Master", "Doctorat", "Autre"] },
  { code: "domain", label: "Quel domaine vous intéresse ?", kind: "single", options: ["Informatique", "Gestion", "Finance", "Droit", "Santé", "Ingénierie", "Commerce", "Communication", "Sciences", "Arts", "Autre"] },
  { code: "destination", label: "Quelle destination envisagez-vous ?", kind: "single", options: ["France", "Belgique", "Luxembourg", "Italie", "Maroc", "Je ne sais pas encore"] },
  { code: "budget", label: "Quel budget annuel pouvez-vous envisager ?", kind: "single", options: ["Moins de 2 000 000 FCFA", "2 à 4 000 000 FCFA", "4 à 6 000 000 FCFA", "Plus de 6 000 000 FCFA", "Je ne sais pas"] },
  { code: "languages", label: "Quelles langues maîtrisez-vous ?", kind: "multi", options: ["Français", "Anglais", "Italien", "Autre"] },
  { code: "goal", label: "Quel est votre objectif ?", kind: "single", options: ["Licence", "Master", "Doctorat", "Formation professionnelle"] },
  { code: "year", label: "Pour quelle année souhaitez-vous partir ?", kind: "number" },
  { code: "institution", label: "Quel type d'établissement préférez-vous ?", kind: "single", options: ["Université publique", "École privée", "Peu importe"] },
  { code: "project", label: "Quel est votre projet professionnel ?", kind: "text" },
];
