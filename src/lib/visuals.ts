import fs from "node:fs";
import path from "node:path";
import type { IconName } from "@/components/visual/Icon";

export const PHOTO_EXTS = ["webp", "avif", "jpg", "jpeg", "png"] as const;
export type PhotoKind = "pays" | "hero";

/**
 * Cherche une photo fournie par l'équipe dans public/images/<kind>/<name>.<ext>.
 * Retourne l'URL publique ou null (on affiche alors l'illustration vectorielle). Nom restreint pour éviter toute traversée de chemin.
 */
export function findPhoto(kind: PhotoKind, name: string, root = process.cwd()): string | null {
  if (!/^[a-z0-9-]{1,60}$/.test(name)) return null;
  for (const ext of PHOTO_EXTS) {
    if (fs.existsSync(path.join(root, "public", "images", kind, `${name}.${ext}`))) return `/images/${kind}/${name}.${ext}`;
  }
  return null;
}

export interface PackStyle { icon: IconName; iconBg: string; soft: string; ink: string; bar: string }

/** Identité visuelle de chaque pack (couleur + icône). Un pack ajouté depuis l'administration reçoit le style par défaut. */
export function packStyle(slug: string): PackStyle {
  switch (slug) {
    case "orientation": return { icon: "compass", iconBg: "from-[#0D7A50] to-[#16A36A]", soft: "bg-[#E7F7F0]", ink: "text-[#0D7A50]", bar: "bg-[#0D7A50]" };
    case "audit-correction": return { icon: "audit", iconBg: "from-[#0B63F6] to-[#4D93FF]", soft: "bg-brand-soft", ink: "text-brand", bar: "bg-brand" };
    case "candidature": return { icon: "send", iconBg: "from-[#063B70] to-[#0B63F6]", soft: "bg-brand-soft", ink: "text-navy", bar: "bg-gold" };
    case "premium": return { icon: "crown", iconBg: "from-[#E8A400] to-[#F5B51B]", soft: "bg-[#FFF4D6]", ink: "text-[#8A6100]", bar: "bg-[#E8A400]" };
    default: return { icon: "sparkles", iconBg: "from-[#0B63F6] to-[#4D93FF]", soft: "bg-brand-soft", ink: "text-brand", bar: "bg-brand" };
  }
}
