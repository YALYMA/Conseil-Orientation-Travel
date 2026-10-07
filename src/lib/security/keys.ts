import { createHash } from "node:crypto";

/** Clés de limitation : on ne stocke ni e-mail ni IP en clair (empreinte SHA-256, salée si RATE_LIMIT_SALT est défini). */
export function hashKey(value: string, salt = process.env.RATE_LIMIT_SALT ?? ""): string {
  return createHash("sha256").update(`${salt}:${value.trim().toLowerCase()}`).digest("hex").slice(0, 32);
}

/**
 * IP du client d'après X-Forwarded-For (première entrée). Fiable derrière Vercel ; derrière un proxy qui laisse passer
 * l'en-tête du client, il peut être falsifié : la limite par e-mail reste alors la protection principale.
 */
export function clientIp(h: { get(name: string): string | null }): string {
  const first = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0]?.trim() ?? "";
  return /^[0-9a-fA-F:.]{3,45}$/.test(first) ? first : "unknown";
}
