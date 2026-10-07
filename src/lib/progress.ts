/** Progression calculée à partir de données réelles. Visa et Départ ne comptent que si `manual` est fourni (étapes saisies par le conseiller). */
export interface ProgressInput {
  profileComplete: boolean;
  documents: { category: string; status: string }[];
  applications: { status: string }[];
  appointments: { kind: string; status: string }[];
  manual?: { visa?: string; depart?: string };
}
export interface ProgressStep { key: string; label: string; done: boolean }

const SUBMITTED = ["SUBMITTED", "WAITING", "ADDITIONAL_REQUEST", "ACCEPTED", "REFUSED"];

export function computeProgress(i: ProgressInput) {
  const docsValidated = i.documents.length > 0 && i.documents.every((d) => d.status === "validated");
  const steps: ProgressStep[] = [
    { key: "profile", label: "Profil", done: i.profileComplete },
    { key: "programs", label: "Formations", done: i.applications.length > 0 },
    { key: "documents", label: "Documents", done: docsValidated },
    { key: "letters", label: "Lettres", done: i.documents.some((d) => d.category === "Lettre de motivation" && d.status === "validated") },
    { key: "applications", label: "Candidatures", done: i.applications.some((a) => SUBMITTED.includes(a.status)) },
    { key: "interview", label: "Entretien", done: i.appointments.some((a) => a.kind.toLowerCase().includes("entretien") && a.status === "done") },
    { key: "admission", label: "Admission", done: i.applications.some((a) => a.status === "ACCEPTED") },
  ];
  if (i.manual) {
    steps.push({ key: "visa", label: "Visa", done: i.manual.visa === "done" }, { key: "depart", label: "Départ", done: i.manual.depart === "done" });
  }
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  return { steps, percent: Math.round((done / steps.length) * 100), next: next?.label ?? null };
}
