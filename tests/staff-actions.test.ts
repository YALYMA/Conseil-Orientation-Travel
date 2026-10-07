import { describe, expect, it } from "vitest";
import { staffActionsFor } from "@/lib/payments/staff-actions";
import { canTransition, ORDER_STATUSES } from "@/lib/payments/workflow";

describe("actions proposées au personnel", () => {
  it("toute action proposée est une transition autorisée pour ce rôle", () => {
    for (const s of ORDER_STATUSES) for (const role of ["advisor", "admin"] as const)
      for (const a of staffActionsFor(s, role)) expect(canTransition(s, a.to, role, "motif")).toBe(true);
  });
  it("valider un paiement n'est proposé qu'en vérification", () => {
    for (const s of ORDER_STATUSES) {
      const has = staffActionsFor(s, "advisor").some((a) => a.to === "FIRST_PAYMENT_CONFIRMED");
      expect(has).toBe(s === "FIRST_PAYMENT_UNDER_REVIEW");
    }
  });
  it("les rejets exigent un motif", () => {
    const rej = staffActionsFor("FIRST_PAYMENT_UNDER_REVIEW", "advisor").find((a) => a.to === "REJECTED");
    expect(rej?.needsReason).toBe(true);
  });
  it("seul l'admin peut annuler un service actif", () => {
    expect(staffActionsFor("SERVICE_ACTIVE", "advisor").some((a) => a.to === "CANCELLED")).toBe(false);
    expect(staffActionsFor("SERVICE_ACTIVE", "admin").some((a) => a.to === "CANCELLED")).toBe(true);
  });
  it("aucune action sur un état terminal", () => {
    expect(staffActionsFor("COMPLETED", "admin")).toEqual([]);
  });
});
