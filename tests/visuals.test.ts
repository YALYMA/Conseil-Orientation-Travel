import { describe, expect, it, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findPhoto, packStyle } from "@/lib/visuals";
import { hasScene } from "@/components/visual/CountryScene";
import { flagFor } from "@/components/visual/Flag";
import { COUNTRIES, PACKS } from "@/lib/content/defaults";

describe("photos de remplacement", () => {
  let root: string;
  beforeAll(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), "vis-")); fs.mkdirSync(path.join(root, "public/images/pays"), { recursive: true }); fs.writeFileSync(path.join(root, "public/images/pays/france.jpg"), "x"); fs.writeFileSync(path.join(root, "public/images/pays/maroc.webp"), "x"); fs.writeFileSync(path.join(root, "public/images/pays/maroc.png"), "x"); });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));
  it("trouve une photo existante", () => expect(findPhoto("pays", "france", root)).toBe("/images/pays/france.jpg"));
  it("préfère le format le plus léger (webp avant png)", () => expect(findPhoto("pays", "maroc", root)).toBe("/images/pays/maroc.webp"));
  it("retourne null si absente (illustration affichée)", () => expect(findPhoto("pays", "italie", root)).toBeNull());
  it("refuse les noms dangereux (traversée de chemin)", () => { for (const bad of ["../../etc/passwd", "a/b", "FRANCE", "", "x".repeat(80), "a.b"]) expect(findPhoto("pays", bad, root)).toBeNull(); });
});

describe("cohérence visuelle du contenu", () => {
  it("chaque pays du catalogue a une illustration ET un drapeau", () => {
    for (const c of COUNTRIES) { expect(hasScene(c.slug), c.slug).toBe(true); expect(flagFor(c.slug), c.slug).not.toBeNull(); }
  });
  it("chaque pack du catalogue a sa propre icône, distincte du style par défaut et des autres packs", () => {
    const icons = PACKS.map((p) => packStyle(p.slug).icon);
    expect(new Set(icons).size).toBe(PACKS.length);
    expect(icons).not.toContain(packStyle("inconnu").icon);
  });
  it("un pack inconnu reçoit un style par défaut valide", () => expect(packStyle("nouveau-pack").icon).toBe("sparkles"));
  it("aucune route de développement (zz-*) ne doit être livrée", () => {
    const dir = path.resolve(__dirname, "../src/app");
    expect(fs.readdirSync(dir).filter((f) => f.startsWith("zz-"))).toEqual([]);
  });
});
