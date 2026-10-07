export const DOCUMENT_CATEGORIES = ["CV", "Diplôme", "Relevés de notes", "Lettre de motivation", "Passeport", "Autre"] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
