import { describe, expect, it } from "vitest";
import { nextStepHref, stepStates } from "@/lib/dashboard";
import { computeProgress } from "@/lib/progress";

describe("tableau de bord : prochaine étape", () => {
  it("chaque étape de progression mène à une page qui existe", () => {
    const keys = computeProgress({ profileComplete: false, documents: [], applications: [], appointments: [], manual: {} }).steps.map((s) => s.key);
    const known = new Set(["/app/projet", "/app/candidatures", "/app/documents", "/app/rendez-vous", "/app/messages"]);
    for (const k of keys) expect(known.has(nextStepHref(k)), k).toBe(true);
  });
  it("étape inconnue : repli sur les messages", () => expect(nextStepHref("inconnue")).toBe("/app/messages"));
  it("une seule étape « en cours » : la première non terminée", () => {
    const s = stepStates([{ done: true }, { done: true }, { done: false }, { done: false }]);
    expect(s.map((x) => x.state)).toEqual(["done", "done", "current", "todo"]);
  });
  it("tout terminé : aucune étape en cours", () => expect(stepStates([{ done: true }, { done: true }]).every((s) => s.state === "done")).toBe(true));
  it("rien de terminé : la première est en cours", () => expect(stepStates([{ done: false }, { done: false }]).map((x) => x.state)).toEqual(["current", "todo"]));
});
