/** Où mène le bouton « prochaine étape » du tableau de bord, selon l'étape de progression en cours. */
const NEXT_HREF: Record<string, string> = {
  profile: "/app/projet",
  programs: "/app/candidatures",
  documents: "/app/documents",
  letters: "/app/documents",
  applications: "/app/candidatures",
  interview: "/app/rendez-vous",
  admission: "/app/candidatures",
  visa: "/app/messages",
  depart: "/app/messages",
};
export const nextStepHref = (key: string): string => NEXT_HREF[key] ?? "/app/messages";

export type StepState = "done" | "current" | "todo";
/** La première étape non terminée est « en cours » ; les suivantes sont « à venir ». */
export function stepStates<T extends { done: boolean }>(steps: T[]): (T & { state: StepState })[] {
  const firstTodo = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, state: s.done ? "done" : i === firstTodo ? "current" : "todo" }));
}
