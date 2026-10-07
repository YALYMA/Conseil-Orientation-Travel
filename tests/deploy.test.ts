import { describe, expect, it } from "vitest";
import { checkEnv, isStrict } from "../scripts/env-rules.mjs";
import { parseStorageMaxMb, MAX_UPLOAD_MB } from "@/lib/env";
import { evaluateHealth } from "@/lib/health";

const good = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "ANON-VALUE-8f3a", SUPABASE_SERVICE_ROLE_KEY: "SERVICE-VALUE-91bc",
  NEXT_PUBLIC_APP_URL: "https://conseil-orientation-travel.com", RATE_LIMIT_SALT: "0123456789abcdef0123",
};

describe("contrôle des variables d'environnement", () => {
  it("accepte une configuration de production valide", () => expect(checkEnv(good).errors).toEqual([]));
  it.each(Object.keys(good))("signale %s manquante", (k) => {
    const e = { ...good } as Record<string, string | undefined>; delete e[k];
    expect(checkEnv(e).errors.length).toBeGreaterThan(0);
  });
  it("refuse localhost et http comme URL publique", () => {
    expect(checkEnv({ ...good, NEXT_PUBLIC_APP_URL: "http://localhost:3000" }).errors).toHaveLength(1);
    expect(checkEnv({ ...good, NEXT_PUBLIC_APP_URL: "http://monsite.com" }).errors).toHaveLength(1);
  });
  it("refuse une URL Supabase qui n'en est pas une", () => expect(checkEnv({ ...good, NEXT_PUBLIC_SUPABASE_URL: "https://evil.example.com" }).errors).toHaveLength(1));
  it("détecte une clé de service identique à la clé anonyme (mauvaise copie)", () => expect(checkEnv({ ...good, SUPABASE_SERVICE_ROLE_KEY: "ANON-VALUE-8f3a" }).errors).toHaveLength(1));
  it("exige un sel de 16 caractères minimum", () => expect(checkEnv({ ...good, RATE_LIMIT_SALT: "court" }).errors).toHaveLength(1));
  it("détecte un secret exposé via NEXT_PUBLIC_", () => expect(checkEnv({ ...good, NEXT_PUBLIC_SERVICE_ROLE_KEY: "x" }).errors).toHaveLength(1));
  it("strict seulement en production Vercel", () => {
    expect(isStrict({ VERCEL_ENV: "production" })).toBe(true);
    expect(isStrict({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isStrict({})).toBe(false);
  });
});

describe("limite de taille des documents (Vercel : 4,5 Mo par requête)", () => {
  it("plafonne à 4 Mo quelle que soit la configuration", () => {
    expect(MAX_UPLOAD_MB).toBe(4);
    expect(parseStorageMaxMb("10")).toBe(4);
    expect(parseStorageMaxMb("25")).toBe(4);
  });
  it("accepte une valeur plus basse et retombe sur 4 si invalide", () => {
    expect(parseStorageMaxMb("2")).toBe(2);
    for (const bad of [undefined, "", "abc", "0", "-3"]) expect(parseStorageMaxMb(bad)).toBe(4);
  });
});

describe("diagnostic de déploiement", () => {
  const env = { ...good };
  it("ok seulement si tout est configuré ET la base répond", () => {
    expect(evaluateHealth({ env, database: "ok" }, false).status).toBe("ok");
    expect(evaluateHealth({ env, database: "error" }, false).status).toBe("degraded");
    expect(evaluateHealth({ env, database: "skipped" }, false).status).toBe("degraded");
    expect(evaluateHealth({ env: { ...env, SUPABASE_SERVICE_ROLE_KEY: "" }, database: "ok" }, false).status).toBe("degraded");
  });
  it("sans jeton : statut seul ; avec jeton : booléens, jamais les valeurs", () => {
    expect(evaluateHealth({ env, database: "ok" }, false)).toEqual({ status: "ok" });
    const d = evaluateHealth({ env, database: "ok" }, true);
    expect(d.checks).toBeDefined();
    const out = JSON.stringify(d);
    for (const secret of ["abcdefgh", "ANON-VALUE-8f3a", "SERVICE-VALUE-91bc", "0123456789abcdef0123", "conseil-orientation-travel.com"]) expect(out).not.toContain(secret);
  });
});
