export const APPLICATION_STATUSES = [
  "TO_PREPARE", "DOCUMENTS_PENDING", "READY_TO_SUBMIT", "SUBMITTED", "WAITING",
  "ADDITIONAL_REQUEST", "ACCEPTED", "REFUSED", "WITHDRAWN",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_LABELS: Record<ApplicationStatus, string> = {
  TO_PREPARE: "À préparer",
  DOCUMENTS_PENDING: "Documents en attente",
  READY_TO_SUBMIT: "Prêt à déposer",
  SUBMITTED: "Déposé",
  WAITING: "En attente",
  ADDITIONAL_REQUEST: "Demande complémentaire",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  WITHDRAWN: "Retiré",
};

const FINAL: ApplicationStatus[] = ["ACCEPTED", "REFUSED", "WITHDRAWN"];

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  TO_PREPARE: ["DOCUMENTS_PENDING", "READY_TO_SUBMIT", "WITHDRAWN"],
  DOCUMENTS_PENDING: ["READY_TO_SUBMIT", "TO_PREPARE", "WITHDRAWN"],
  READY_TO_SUBMIT: ["SUBMITTED", "DOCUMENTS_PENDING", "WITHDRAWN"],
  SUBMITTED: ["WAITING", "ADDITIONAL_REQUEST", ...FINAL],
  WAITING: ["ADDITIONAL_REQUEST", ...FINAL],
  ADDITIONAL_REQUEST: ["WAITING", "SUBMITTED", "WITHDRAWN"],
  ACCEPTED: [],
  REFUSED: [],
  WITHDRAWN: [],
};

export function canMoveApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_TRANSITIONS[from].includes(to);
}

/** Avancement indicatif affiché à l'étudiant (pas une promesse de résultat). */
export const APPLICATION_PROGRESS: Record<ApplicationStatus, number> = {
  TO_PREPARE: 10, DOCUMENTS_PENDING: 30, READY_TO_SUBMIT: 60, SUBMITTED: 75, WAITING: 85,
  ADDITIONAL_REQUEST: 80, ACCEPTED: 100, REFUSED: 100, WITHDRAWN: 100,
};
