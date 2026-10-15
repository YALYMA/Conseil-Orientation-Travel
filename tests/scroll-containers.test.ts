import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Régression : un conteneur à défilement horizontal qui n'est PAS positionné laisse s'échapper ses enfants en `position: absolute`
 * (notamment les textes `sr-only`), qui élargissent alors la page entière (débordement horizontal sur mobile).
 * Mesuré : le tableau comparatif de 680 px faisait 649 px de large de page à 360 px d'écran.
 */
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(path.resolve(__dirname, "../src")).filter((f) => f.endsWith(".tsx"));

describe("conteneurs à défilement horizontal", () => {
  it("tout overflow-x-auto est positionné (relative/absolute/fixed/sticky)", () => {
    const bad: string[] = [];
    for (const f of files) {
      for (const m of fs.readFileSync(f, "utf8").matchAll(/className="([^"]*overflow-x-auto[^"]*)"/g)) {
        if (!/(^|\s)(relative|absolute|fixed|sticky)(\s|$)/.test(m[1])) bad.push(path.relative(process.cwd(), f));
      }
    }
    expect(bad).toEqual([]);
  });
});
