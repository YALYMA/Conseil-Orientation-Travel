/**
 * Défense en profondeur contre le CSRF pour les routes API (les server actions Next.js ont leur propre contrôle).
 * Un navigateur envoie toujours `Origin` (POST) ou `Sec-Fetch-Site`. Absence des deux = refus.
 */
export function isSameOrigin(h: { get(name: string): string | null }): boolean {
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  const origin = h.get("origin");
  if (origin) {
    try { return !!host && new URL(origin).host.toLowerCase() === host; } catch { return false; }
  }
  const site = h.get("sec-fetch-site");
  return site === "same-origin" || site === "none";
}
