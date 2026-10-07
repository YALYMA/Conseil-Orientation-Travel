import { formatFcfa } from "./split";

export interface ProofMessageInput {
  lastName: string;
  firstName: string;
  packName: string;
  country: string;
  amount: number;
  phone: string;
  stage: "initial" | "balance";
}

export function buildProofMessage(i: ProofMessageInput): string {
  const label = i.stage === "initial" ? "paiement initial" : "solde de mon pack";
  return [
    "Bonjour Conseil-Orientation-Travel.",
    "",
    `Je viens d'effectuer mon ${label}.`,
    "",
    `Nom : ${i.lastName}`,
    `Prénom : ${i.firstName}`,
    `Pack : ${i.packName}`,
    `Pays : ${i.country}`,
    `Montant : ${formatFcfa(i.amount)}`,
    `Numéro de téléphone : ${i.phone}`,
    "",
    "Je joins ma preuve de paiement.",
  ].join("\n");
}

/** Lien WhatsApp prérempli. Le numéro vient de la configuration, jamais du code. */
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) throw new Error("Numéro WhatsApp non configuré.");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
