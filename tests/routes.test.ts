import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/** Garde-fou : aucune page « fantôme » (dossier vide) et aucun lien/redirection/notification vers une route inexistante. */
const root = path.resolve(__dirname, "..");
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const dirs = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((e) => [path.join(d, e.name), ...dirs(path.join(d, e.name))]);

const appDir = path.join(root, "src/app");
const routes = walk(appDir).filter((f) => /\/(page\.tsx|route\.ts)$/.test(f))
  .map((f) => "/" + path.relative(appDir, path.dirname(f)).split(path.sep).filter((s) => !/^\(.*\)$/.test(s)).join("/"))
  .map((r) => r.replace(/\/$/, "") || "/");
const matchers = routes.map((r) => new RegExp("^" + r.replace(/\[[^\]]+\]/g, "[^/]+") + "/?$"));
const exists = (p: string) => matchers.some((m) => m.test(p));

describe("intégrité des routes", () => {
  it("aucun dossier vide dans src/app (page annoncée mais absente)", () => {
    expect(dirs(appDir).filter((d) => fs.readdirSync(d).length === 0).map((d) => path.relative(root, d))).toEqual([]);
  });

  it("tout lien, redirection ou lien de notification pointe vers une route qui existe", () => {
    const files = [...walk(path.join(root, "src")).filter((f) => /\.tsx?$/.test(f)), ...walk(path.join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql"))];
    const known = /^\/(app|advisor|admin|api|pays|packs|orientation|comment-ca-marche|a-propos|blog|faq|contact|connexion|inscription|mentions-legales|confidentialite|cgu|mot-de-passe|auth)(\/|$)/;
    const bad = new Set<string>();
    for (const f of files) {
      for (const line of fs.readFileSync(f, "utf8").split("\n")) {
        if (/revalidatePath|matcher|PROTECTED|disallow|startsWith|allow:/.test(line)) continue;
        if (!/href|redirect\(|flashRedirect\(|router\.push|notify_user\(|startsWith\(\/\^/.test(line) || /startsWith\(\/\^/.test(line)) continue;
        for (const m of line.matchAll(/["'`](\/[A-Za-z0-9_\-/${}.\[\]]*)(?:[?#][^"'`]*)?["'`]/g)) {
          const p = m[1].replace(/\$\{[^}]*\}/g, "x");
          if (known.test(p) && !exists(p)) bad.add(`${p}  ←  ${path.relative(root, f)}`);
        }
      }
    }
    expect([...bad]).toEqual([]);
  });

  it("les espaces connectés exposent leurs pages principales", () => {
    for (const r of ["/app/dashboard", "/app/profil", "/app/notifications", "/app/paiements", "/app/documents", "/advisor/dashboard", "/advisor/etudiants", "/admin"]) expect(exists(r), r).toBe(true);
  });
});
