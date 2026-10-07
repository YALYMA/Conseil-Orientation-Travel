import { describe, expect, it } from "vitest";
import { computeProgress } from "@/lib/progress";

const empty = { profileComplete: false, documents: [], applications: [], appointments: [] };

describe("progression réelle", () => {
  it("0 % sans aucune donnée", () => { const p = computeProgress(empty); expect(p.percent).toBe(0); expect(p.next).toBe("Profil"); });
  it("des documents non tous validés ne comptent pas", () => {
    const p = computeProgress({ ...empty, documents: [{ category: "CV", status: "validated" }, { category: "Passeport", status: "to_fix" }] });
    expect(p.steps.find((s) => s.key === "documents")!.done).toBe(false);
  });
  it("une candidature seulement préparée n'est pas « déposée »", () => {
    const p = computeProgress({ ...empty, applications: [{ status: "READY_TO_SUBMIT" }] });
    expect(p.steps.find((s) => s.key === "programs")!.done).toBe(true);
    expect(p.steps.find((s) => s.key === "applications")!.done).toBe(false);
  });
  it("l'admission n'est cochée que si une candidature est acceptée", () => {
    expect(computeProgress({ ...empty, applications: [{ status: "REFUSED" }] }).steps.find((s) => s.key === "admission")!.done).toBe(false);
    expect(computeProgress({ ...empty, applications: [{ status: "ACCEPTED" }] }).steps.find((s) => s.key === "admission")!.done).toBe(true);
  });
  it("parcours complet = 100 %", () => {
    const p = computeProgress({
      profileComplete: true,
      documents: [{ category: "Lettre de motivation", status: "validated" }],
      applications: [{ status: "ACCEPTED" }],
      appointments: [{ kind: "Préparation entretien", status: "done" }],
    });
    expect(p.percent).toBe(100); expect(p.next).toBeNull();
  });
});

describe("progression avec visa et départ", () => {
  it("sans données manuelles : 7 étapes (comportement inchangé)", () => expect(computeProgress(empty).steps).toHaveLength(7));
  it("avec données manuelles : 9 étapes, visa/départ cochés seulement si « done »", () => {
    const p = computeProgress({ ...empty, manual: { visa: "in_progress", depart: "todo" } });
    expect(p.steps).toHaveLength(9);
    expect(p.steps.filter((s) => s.key === "visa" || s.key === "depart").every((s) => !s.done)).toBe(true);
    const q = computeProgress({ ...empty, manual: { visa: "done", depart: "done" } });
    expect(q.steps.filter((s) => s.done).map((s) => s.key)).toEqual(["visa", "depart"]);
  });
  it("100 % exige aussi visa et départ quand ils sont suivis", () => {
    const base = { profileComplete: true, documents: [{ category: "Lettre de motivation", status: "validated" }], applications: [{ status: "ACCEPTED" }], appointments: [{ kind: "Entretien", status: "done" }] };
    expect(computeProgress({ ...base, manual: { visa: "done", depart: "todo" } }).percent).toBeLessThan(100);
    expect(computeProgress({ ...base, manual: { visa: "done", depart: "done" } }).percent).toBe(100);
  });
});
