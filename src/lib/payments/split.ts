/** Calcul du paiement en deux étapes. Toujours exécuté côté serveur. */
export interface PaymentSplit {
  total: number;
  first: number;
  balance: number;
}

export function splitPayment(total: number): PaymentSplit {
  if (!Number.isInteger(total) || total <= 0) {
    throw new RangeError("Le prix total doit être un entier positif (FCFA).");
  }
  const first = Math.floor(total / 2);
  return { total, first, balance: total - first };
}

export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount).replace(/\u202f|\u00a0/g, " ")} FCFA`;
}
