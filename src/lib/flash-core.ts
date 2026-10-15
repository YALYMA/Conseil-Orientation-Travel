import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Messages « flash » passés dans l'URL après une action. Ils sont SIGNÉS (HMAC) et expirent : sans cela, n'importe qui pouvait
 * fabriquer un lien `?erreur=<texte libre>` affichant une fausse consigne (ex. « renvoyez le paiement au 77… ») dans l'interface officielle.
 */
export type FlashKind = "ok" | "erreur";
export const FLASH_TTL_MS = 5 * 60 * 1000;
const MAX_LEN = 200;

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const mac = (secret: string, kind: FlashKind, payload: string) => createHmac("sha256", secret).update(`flash:v1:${kind}:${payload}`).digest().subarray(0, 24);

export function signFlash(secret: string, kind: FlashKind, text: string, now = Date.now()): string {
  const payload = b64(JSON.stringify({ t: text.slice(0, MAX_LEN), e: now + FLASH_TTL_MS }));
  return `${payload}.${b64(mac(secret, kind, payload))}`;
}

export function verifyFlash(secret: string | null, kind: FlashKind, token: unknown, now = Date.now()): string | undefined {
  if (!secret || typeof token !== "string" || token.length > 1200) return undefined;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return undefined;
  // Forme canonique unique : on compare les chaînes base64url elles-mêmes (le décodage ignorerait des bits en trop,
  // ce qui rendrait « signature + caractère » valide).
  const expectedSig = mac(secret, kind, payload).toString("base64url");
  const a = Buffer.from(sig), b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  try {
    const { t, e } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { t?: unknown; e?: unknown };
    if (typeof t !== "string" || typeof e !== "number" || e < now) return undefined;
    return t.slice(0, MAX_LEN);
  } catch { return undefined; }
}
