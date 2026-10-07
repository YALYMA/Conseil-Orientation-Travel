import { describe, expect, it } from "vitest";
import { canMoveApplication, APPLICATION_STATUSES } from "@/lib/applications/transitions";

describe("transitions de candidature", () => {
  it("suit le parcours nominal", () => {
    expect(canMoveApplication("TO_PREPARE", "READY_TO_SUBMIT")).toBe(true);
    expect(canMoveApplication("READY_TO_SUBMIT", "SUBMITTED")).toBe(true);
    expect(canMoveApplication("SUBMITTED", "WAITING")).toBe(true);
    expect(canMoveApplication("WAITING", "ACCEPTED")).toBe(true);
  });
  it("interdit de déposer sans préparation", () => {
    expect(canMoveApplication("TO_PREPARE", "SUBMITTED")).toBe(false);
  });
  it("les états finaux sont terminaux", () => {
    for (const s of ["ACCEPTED", "REFUSED", "WITHDRAWN"] as const)
      for (const t of APPLICATION_STATUSES) expect(canMoveApplication(s, t)).toBe(false);
  });
});
