import { describe, expect, it } from "vitest";
import { clientIp, hashKey } from "@/lib/security/keys";
import { buildCsp, securityHeaders } from "@/lib/security/headers";

const h = (m: Record<string, string>) => ({ get: (k: string) => m[k] ?? null });

describe("clés de limitation", () => {
  it("empreinte stable, insensible à la casse, sans donnée en clair", () => {
    expect(hashKey("A@B.CO ", "s")).toBe(hashKey("a@b.co", "s"));
    expect(hashKey("a@b.co", "s")).not.toContain("a@b.co");
    expect(hashKey("a@b.co", "s1")).not.toBe(hashKey("a@b.co", "s2"));
    expect(hashKey("x")).toHaveLength(32);
  });
  it("IP : première entrée de X-Forwarded-For, valeurs douteuses rejetées", () => {
    expect(clientIp(h({ "x-forwarded-for": "41.82.0.1, 10.0.0.2" }))).toBe("41.82.0.1");
    expect(clientIp(h({ "x-forwarded-for": "2001:db8::1" }))).toBe("2001:db8::1");
    expect(clientIp(h({ "x-real-ip": "41.82.0.9" }))).toBe("41.82.0.9");
    for (const bad of ["<script>", "a b c", "x".repeat(80), ""]) expect(clientIp(h({ "x-forwarded-for": bad }))).toBe("unknown");
    expect(clientIp(h({}))).toBe("unknown");
  });
});

describe("en-têtes de sécurité", () => {
  const csp = buildCsp({ supabaseUrl: "https://abc.supabase.co" });
  it("interdit l'intégration en iframe, les objets et les bases externes", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });
  it("n'autorise que Supabase en connexion externe, sans joker", () => {
    expect(csp).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    expect(csp).not.toMatch(/\*/);
    expect(csp).not.toMatch(/img-src[^;]*https:/);
  });
  it("eval seulement en développement", () => {
    expect(buildCsp({ dev: true })).toContain("'unsafe-eval'");
    expect(csp).not.toContain("'unsafe-eval'");
  });
  it("tolère une URL Supabase absente ou invalide", () => {
    expect(buildCsp({})).toContain("connect-src 'self'");
    expect(buildCsp({ supabaseUrl: "pas une url" })).toContain("connect-src 'self'");
  });
  it("fournit l'ensemble des en-têtes attendus", () => {
    const keys = securityHeaders({}).map((x) => x.key);
    expect(keys).toEqual(expect.arrayContaining(["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]));
  });
});
