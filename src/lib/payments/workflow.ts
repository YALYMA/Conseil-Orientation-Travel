export const ORDER_STATUSES = [
  "ORDER_CREATED",
  "FIRST_PAYMENT_PENDING",
  "FIRST_PAYMENT_PROOF_SUBMITTED",
  "FIRST_PAYMENT_UNDER_REVIEW",
  "FIRST_PAYMENT_CONFIRMED",
  "SERVICE_ACTIVE",
  "SERVICE_IN_PROGRESS",
  "SERVICE_READY_FOR_FINAL_PAYMENT",
  "BALANCE_PROOF_SUBMITTED",
  "BALANCE_CONFIRMED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Actor = "student" | "advisor" | "admin" | "system";

interface Transition {
  to: OrderStatus;
  actors: Actor[];
  /** Une raison est obligatoire (rejet / annulation). */
  requiresReason?: boolean;
}

/**
 * Seul le staff peut confirmer un paiement : une preuve envoyée par l'étudiant
 * ne fait jamais passer la commande à un état « confirmé ».
 */
const T = (to: OrderStatus, actors: Actor[], requiresReason = false): Transition => ({ to, actors, requiresReason });

export const TRANSITIONS: Record<OrderStatus, Transition[]> = {
  ORDER_CREATED: [T("FIRST_PAYMENT_PENDING", ["system", "student"]), T("CANCELLED", ["student", "admin"], true)],
  FIRST_PAYMENT_PENDING: [
    T("FIRST_PAYMENT_PROOF_SUBMITTED", ["student"]),
    T("CANCELLED", ["student", "admin"], true),
  ],
  FIRST_PAYMENT_PROOF_SUBMITTED: [T("FIRST_PAYMENT_UNDER_REVIEW", ["advisor", "admin"])],
  FIRST_PAYMENT_UNDER_REVIEW: [
    T("FIRST_PAYMENT_CONFIRMED", ["advisor", "admin"]),
    T("REJECTED", ["advisor", "admin"], true),
  ],
  FIRST_PAYMENT_CONFIRMED: [T("SERVICE_ACTIVE", ["system", "advisor", "admin"])],
  SERVICE_ACTIVE: [T("SERVICE_IN_PROGRESS", ["advisor", "admin"]), T("CANCELLED", ["admin"], true)],
  SERVICE_IN_PROGRESS: [
    T("SERVICE_READY_FOR_FINAL_PAYMENT", ["advisor", "admin"]),
    T("CANCELLED", ["admin"], true),
  ],
  SERVICE_READY_FOR_FINAL_PAYMENT: [T("BALANCE_PROOF_SUBMITTED", ["student"])],
  BALANCE_PROOF_SUBMITTED: [
    T("BALANCE_CONFIRMED", ["advisor", "admin"]),
    // preuve refusée : la commande revient à l'étape « solde à payer »
    T("SERVICE_READY_FOR_FINAL_PAYMENT", ["advisor", "admin"], true),
  ],
  BALANCE_CONFIRMED: [T("COMPLETED", ["system", "advisor", "admin"])],
  COMPLETED: [],
  // Après rejet de la 1re preuve, l'étudiant peut en soumettre une nouvelle.
  REJECTED: [T("FIRST_PAYMENT_PENDING", ["advisor", "admin"])],
  CANCELLED: [],
};

export class TransitionError extends Error {}

export function assertTransition(from: OrderStatus, to: OrderStatus, actor: Actor, reason?: string): void {
  const rule = TRANSITIONS[from].find((t) => t.to === to);
  if (!rule) throw new TransitionError(`Transition interdite : ${from} → ${to}`);
  if (!rule.actors.includes(actor)) throw new TransitionError(`${actor} ne peut pas effectuer ${from} → ${to}`);
  if (rule.requiresReason && !reason?.trim()) throw new TransitionError("Une raison est obligatoire.");
}

export function canTransition(from: OrderStatus, to: OrderStatus, actor: Actor, reason?: string): boolean {
  try {
    assertTransition(from, to, actor, reason);
    return true;
  } catch {
    return false;
  }
}
