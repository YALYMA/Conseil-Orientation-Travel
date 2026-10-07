import { ORDER_STATUSES, type OrderStatus } from "./workflow";

/** Textes destinés à l'étudiant : où j'en suis, et quelle est la prochaine étape. */
export const ORDER_LABELS: Record<OrderStatus, { label: string; next: string }> = {
  ORDER_CREATED: { label: "Commande créée", next: "Votre commande est en cours d'enregistrement." },
  FIRST_PAYMENT_PENDING: { label: "Premier paiement à effectuer", next: "Payez le premier paiement via Wave, puis envoyez votre preuve sur WhatsApp." },
  FIRST_PAYMENT_PROOF_SUBMITTED: { label: "Preuve envoyée", next: "Notre équipe va vérifier votre paiement." },
  FIRST_PAYMENT_UNDER_REVIEW: { label: "Paiement en vérification", next: "Votre paiement est en cours de vérification par l'équipe." },
  FIRST_PAYMENT_CONFIRMED: { label: "Paiement validé", next: "Votre accompagnement va démarrer." },
  SERVICE_ACTIVE: { label: "Accompagnement activé", next: "Votre conseiller prend en charge votre dossier." },
  SERVICE_IN_PROGRESS: { label: "Accompagnement en cours", next: "Suivez l'avancement avec votre conseiller." },
  SERVICE_READY_FOR_FINAL_PAYMENT: { label: "Solde à régler", next: "Les prestations de votre pack sont finalisées : le solde est dû." },
  BALANCE_PROOF_SUBMITTED: { label: "Preuve du solde envoyée", next: "Notre équipe va vérifier votre paiement." },
  BALANCE_CONFIRMED: { label: "Solde validé", next: "Votre accompagnement est en cours de clôture." },
  COMPLETED: { label: "Accompagnement terminé", next: "Merci pour votre confiance." },
  REJECTED: { label: "Paiement non validé", next: "Votre paiement n'a pas pu être validé. Consultez le motif ou contactez votre conseiller." },
  CANCELLED: { label: "Commande annulée", next: "Cette commande a été annulée." },
};

export const isAwaitingStudentPayment = (s: OrderStatus) => s === "FIRST_PAYMENT_PENDING" || s === "SERVICE_READY_FOR_FINAL_PAYMENT";
export const allStatusesLabelled = () => ORDER_STATUSES.every((s) => ORDER_LABELS[s]);
