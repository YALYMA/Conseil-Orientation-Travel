import { describe, expect, it } from "vitest";
import { splitPayment, formatFcfa } from "@/lib/payments/split";
import { assertTransition, canTransition, TransitionError } from "@/lib/payments/workflow";
import { buildProofMessage, whatsappLink } from "@/lib/payments/links";

describe("calcul du paiement en deux étapes", () => {
  it.each([
    [20000, 10000, 10000],
    [40000, 20000, 20000],
    [75000, 37500, 37500],
    [120000, 60000, 60000],
  ])("%i → %i + %i", (total, first, balance) => {
    expect(splitPayment(total)).toEqual({ total, first, balance });
  });
  it("le solde absorbe l'arrondi sur un total impair", () => {
    const s = splitPayment(40001);
    expect(s.first + s.balance).toBe(40001);
  });
  it.each([0, -5, 1.5, NaN])("refuse %s", (v) => {
    expect(() => splitPayment(v)).toThrow(RangeError);
  });
  it("formate en FCFA", () => expect(formatFcfa(37500)).toBe("37.500 FCFA"));
});

describe("workflow de paiement", () => {
  it("une preuve envoyée ne confirme jamais le paiement", () => {
    expect(canTransition("FIRST_PAYMENT_PENDING", "FIRST_PAYMENT_CONFIRMED", "student")).toBe(false);
    expect(canTransition("FIRST_PAYMENT_PROOF_SUBMITTED", "FIRST_PAYMENT_CONFIRMED", "student")).toBe(false);
    expect(canTransition("FIRST_PAYMENT_PENDING", "FIRST_PAYMENT_PROOF_SUBMITTED", "student")).toBe(true);
  });
  it("l'étudiant ne peut pas confirmer lui-même", () => {
    expect(canTransition("FIRST_PAYMENT_UNDER_REVIEW", "FIRST_PAYMENT_CONFIRMED", "student")).toBe(false);
    expect(canTransition("BALANCE_PROOF_SUBMITTED", "BALANCE_CONFIRMED", "student")).toBe(false);
  });
  it("le staff confirme", () => {
    expect(canTransition("FIRST_PAYMENT_UNDER_REVIEW", "FIRST_PAYMENT_CONFIRMED", "advisor")).toBe(true);
    expect(canTransition("BALANCE_PROOF_SUBMITTED", "BALANCE_CONFIRMED", "admin")).toBe(true);
  });
  it("rejet et annulation exigent une raison", () => {
    expect(() => assertTransition("FIRST_PAYMENT_UNDER_REVIEW", "REJECTED", "admin")).toThrow(TransitionError);
    expect(() => assertTransition("FIRST_PAYMENT_UNDER_REVIEW", "REJECTED", "admin", "Montant incorrect")).not.toThrow();
  });
  it("interdit les sauts d'étapes", () => {
    expect(canTransition("ORDER_CREATED", "COMPLETED", "admin")).toBe(false);
    expect(canTransition("SERVICE_ACTIVE", "BALANCE_CONFIRMED", "admin")).toBe(false);
  });
  it("COMPLETED est terminal", () => {
    expect(canTransition("COMPLETED", "CANCELLED", "admin", "x")).toBe(false);
  });
  it("parcours nominal complet", () => {
    const path: [string, string, "student" | "advisor" | "system"][] = [
      ["ORDER_CREATED", "FIRST_PAYMENT_PENDING", "system"],
      ["FIRST_PAYMENT_PENDING", "FIRST_PAYMENT_PROOF_SUBMITTED", "student"],
      ["FIRST_PAYMENT_PROOF_SUBMITTED", "FIRST_PAYMENT_UNDER_REVIEW", "advisor"],
      ["FIRST_PAYMENT_UNDER_REVIEW", "FIRST_PAYMENT_CONFIRMED", "advisor"],
      ["FIRST_PAYMENT_CONFIRMED", "SERVICE_ACTIVE", "system"],
      ["SERVICE_ACTIVE", "SERVICE_IN_PROGRESS", "advisor"],
      ["SERVICE_IN_PROGRESS", "SERVICE_READY_FOR_FINAL_PAYMENT", "advisor"],
      ["SERVICE_READY_FOR_FINAL_PAYMENT", "BALANCE_PROOF_SUBMITTED", "student"],
      ["BALANCE_PROOF_SUBMITTED", "BALANCE_CONFIRMED", "advisor"],
      ["BALANCE_CONFIRMED", "COMPLETED", "system"],
    ];
    for (const [f, t, a] of path) expect(canTransition(f as never, t as never, a)).toBe(true);
  });
});

describe("liens WhatsApp", () => {
  it("génère un lien encodé avec le message prérempli", () => {
    const msg = buildProofMessage({
      lastName: "Fall", firstName: "Abdoulaye", packName: "Candidature", country: "France",
      amount: 37500, phone: "+221 77 000 00 00", stage: "initial",
    });
    const link = whatsappLink("+221 77 000 00 01", msg);
    expect(link.startsWith("https://wa.me/221770000001?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toContain("37.500 FCFA");
  });
  it("refuse un numéro non configuré", () => {
    expect(() => whatsappLink("", "x")).toThrow();
  });
});
