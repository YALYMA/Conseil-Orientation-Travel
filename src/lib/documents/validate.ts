export const ALLOWED_MIME: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
};

export type FileCheck = { ok: true; safeName: string } | { ok: false; error: string };

export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "fichier";
  const cleaned = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.-]+/, "")
    .slice(-100);
  return cleaned || "fichier";
}

export function validateUpload(file: { name: string; type: string; size: number }, maxMb = 10): FileCheck {
  if (file.size <= 0) return { ok: false, error: "Le fichier est vide." };
  if (file.size > maxMb * 1024 * 1024) return { ok: false, error: `Le fichier dépasse ${maxMb} Mo.` };
  const exts = ALLOWED_MIME[file.type];
  if (!exts) return { ok: false, error: "Type de fichier non autorisé (PDF, JPG, PNG ou DOCX)." };
  const safeName = sanitizeFileName(file.name);
  const ext = safeName.split(".").pop()?.toLowerCase() ?? "";
  if (!exts.includes(ext)) return { ok: false, error: "L'extension ne correspond pas au type du fichier." };
  return { ok: true, safeName };
}

/** Contrôle des « magic bytes » côté serveur : le MIME déclaré par le navigateur ne suffit pas. */
export function matchesSignature(mime: string, head: Uint8Array): boolean {
  const starts = (...b: number[]) => b.every((v, i) => head[i] === v);
  switch (mime) {
    case "application/pdf": return starts(0x25, 0x50, 0x44, 0x46);
    case "image/png": return starts(0x89, 0x50, 0x4e, 0x47);
    case "image/jpeg": return starts(0xff, 0xd8, 0xff);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return starts(0x50, 0x4b, 0x03, 0x04);
    default: return false;
  }
}
