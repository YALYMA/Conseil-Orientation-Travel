import { describe, expect, it } from "vitest";
import { isSameOrigin } from "@/lib/security/origin";
const h = (m: Record<string, string>) => ({ get: (k: string) => m[k] ?? null });

describe("contrôle d'origine (CSRF)", () => {
  it("accepte la même origine", () => {
    expect(isSameOrigin(h({ origin: "https://site.com", host: "site.com" }))).toBe(true);
    expect(isSameOrigin(h({ origin: "https://site.com", "x-forwarded-host": "site.com", host: "interne:3000" }))).toBe(true);
    expect(isSameOrigin(h({ "sec-fetch-site": "same-origin", host: "site.com" }))).toBe(true);
  });
  it("refuse une origine étrangère, y compris un sous-domaine ou un domaine qui commence pareil", () => {
    for (const origin of ["https://evil.com", "https://site.com.evil.com", "https://sub.site.com", "null", "pas une url"])
      expect(isSameOrigin(h({ origin, host: "site.com" }))).toBe(false);
  });
  it("refuse un site tiers signalé par le navigateur et l'absence totale d'indice", () => {
    expect(isSameOrigin(h({ "sec-fetch-site": "cross-site", host: "site.com" }))).toBe(false);
    expect(isSameOrigin(h({ "sec-fetch-site": "same-site", host: "site.com" }))).toBe(false);
    expect(isSameOrigin(h({ host: "site.com" }))).toBe(false);
    expect(isSameOrigin(h({}))).toBe(false);
  });
});
