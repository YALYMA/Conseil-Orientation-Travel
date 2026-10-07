import { describe, expect, it } from "vitest";
import { ORDER_LABELS, allStatusesLabelled, isAwaitingStudentPayment } from "@/lib/payments/labels";
import { ORDER_STATUSES } from "@/lib/payments/workflow";

describe("libellés étudiant", () => {
  it("chaque statut a un libellé et une prochaine étape", () => {
    expect(allStatusesLabelled()).toBe(true);
    for (const s of ORDER_STATUSES) { expect(ORDER_LABELS[s].label.length).toBeGreaterThan(3); expect(ORDER_LABELS[s].next.length).toBeGreaterThan(10); }
  });
  it("aucun libellé ne lie le paiement à l'admission", () => {
    const all = JSON.stringify(ORDER_LABELS).toLowerCase();
    expect(all).not.toMatch(/pour recevoir votre admission|admission garantie|visa garanti/);
  });
  it("le paiement n'est demandé qu'aux deux étapes prévues", () => {
    const asking = ORDER_STATUSES.filter(isAwaitingStudentPayment);
    expect(asking).toEqual(["FIRST_PAYMENT_PENDING", "SERVICE_READY_FOR_FINAL_PAYMENT"]);
  });
});
