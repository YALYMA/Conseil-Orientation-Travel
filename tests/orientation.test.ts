import { describe, expect, it } from "vitest";
import { buildDiagnostic, validateAnswers } from "@/lib/orientation/diagnostic";
import { QUESTIONS } from "@/lib/orientation/questions";

const ok = { level: "Licence", domain: "Informatique", destination: "France", budget: "2 à 4.000.000 FCFA", languages: ["Français"], goal: "Master", year: "2027", institution: "Peu importe", project: "" };

describe("test d'orientation", () => {
  it("accepte des réponses valides", () => expect(validateAnswers(ok, QUESTIONS)).toEqual([]));
  it("refuse une réponse manquante", () => expect(validateAnswers({ ...ok, level: undefined }, QUESTIONS).length).toBe(1));
  it("refuse une option inconnue", () => expect(validateAnswers({ ...ok, destination: "Mars" }, QUESTIONS).length).toBe(1));
  it("refuse une année absurde", () => expect(validateAnswers({ ...ok, year: "1999" }, QUESTIONS).length).toBe(1));
  it("le diagnostic ne promet jamais l'admission", () => {
    const d = buildDiagnostic(ok);
    const text = JSON.stringify(d).toLowerCase();
    for (const w of ["serez accepté", "admission garantie", "visa garanti"]) expect(text).not.toContain(w);
    expect(d.suggestedPack).toBe("candidature");
  });
  it("destination inconnue → pack Orientation", () => {
    expect(buildDiagnostic({ ...ok, destination: "Je ne sais pas encore" }).suggestedPack).toBe("orientation");
  });
  it("signale un objectif incohérent", () => {
    expect(buildDiagnostic({ ...ok, level: "Bac", goal: "Master" }).notes.length).toBeGreaterThan(0);
  });
});
