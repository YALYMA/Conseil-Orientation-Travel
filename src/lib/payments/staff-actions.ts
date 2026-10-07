import { TRANSITIONS, type OrderStatus } from "./workflow";

export interface StaffAction { to: OrderStatus; label: string; needsReason: boolean; tone: "primary" | "success" | "outline" | "danger" }

/** Libellés des seules transitions proposées au personnel (les transitions « système » sont automatiques). */
const LABELS: Partial<Record<`${OrderStatus}>${OrderStatus}`, Omit<StaffAction, "to" | "needsReason">>> = {
  "FIRST_PAYMENT_PROOF_SUBMITTED>FIRST_PAYMENT_UNDER_REVIEW": { label: "Mettre en vérification", tone: "outline" },
  "FIRST_PAYMENT_UNDER_REVIEW>FIRST_PAYMENT_CONFIRMED": { label: "Valider le paiement", tone: "success" },
  "FIRST_PAYMENT_UNDER_REVIEW>REJECTED": { label: "Rejeter le paiement", tone: "danger" },
  "REJECTED>FIRST_PAYMENT_PENDING": { label: "Rouvrir pour une nouvelle preuve", tone: "outline" },
  "SERVICE_ACTIVE>SERVICE_IN_PROGRESS": { label: "Démarrer l'accompagnement", tone: "primary" },
  "SERVICE_IN_PROGRESS>SERVICE_READY_FOR_FINAL_PAYMENT": { label: "Prestations finalisées : demander le solde", tone: "primary" },
  "BALANCE_PROOF_SUBMITTED>BALANCE_CONFIRMED": { label: "Valider le solde", tone: "success" },
  "BALANCE_PROOF_SUBMITTED>SERVICE_READY_FOR_FINAL_PAYMENT": { label: "Refuser la preuve du solde", tone: "danger" },
  "SERVICE_ACTIVE>CANCELLED": { label: "Annuler la commande", tone: "danger" },
  "SERVICE_IN_PROGRESS>CANCELLED": { label: "Annuler la commande", tone: "danger" },
};

export function staffActionsFor(status: OrderStatus, role: "advisor" | "admin"): StaffAction[] {
  return TRANSITIONS[status]
    .filter((t) => t.actors.includes(role))
    .flatMap((t) => {
      const l = LABELS[`${status}>${t.to}`];
      return l ? [{ to: t.to, needsReason: !!t.requiresReason, ...l }] : [];
    });
}

/** Commandes qui demandent une action du personnel (utilisé pour les KPI). */
export const NEEDS_STAFF_ATTENTION: OrderStatus[] = ["FIRST_PAYMENT_PROOF_SUBMITTED", "FIRST_PAYMENT_UNDER_REVIEW", "BALANCE_PROOF_SUBMITTED"];
