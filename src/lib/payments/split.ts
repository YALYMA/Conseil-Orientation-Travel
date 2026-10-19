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

/** Montant en FCFA, milliers séparés par un point : 40.000 FCFA. Source unique du format : ne pas reformater ailleurs. */
export function formatFcfa(amount: number): string {
  const n = String(Math.trunc(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount < 0 ? "-" : ""}${n} FCFA`;
}
