import "server-only";
import { redirect } from "next/navigation";
import { signFlash, verifyFlash, type FlashKind } from "./flash-core";

/** Secret : RATE_LIMIT_SALT (déjà exigé en production par le contrôle de build). Hors production, valeur de développement. */
function secret(): string | null {
  const s = process.env.RATE_LIMIT_SALT;
  if (s && s.length >= 16) return s;
  return process.env.NODE_ENV === "production" ? null : "dev-only-flash-secret-not-for-production";
}

/** Redirige vers `path` avec un message signé. Sans secret (production mal configurée), redirige sans message. */
export function flashRedirect(path: string, kind: FlashKind, text: string): never {
  const key = secret();
  if (!key) { console.error("[flash] RATE_LIMIT_SALT manquant : message non transmis"); return redirect(path); }
  return redirect(`${path}?${kind}=${encodeURIComponent(signFlash(key, kind, text))}`);
}

export const readFlash = (kind: FlashKind, token: unknown) => verifyFlash(secret(), kind, token);
