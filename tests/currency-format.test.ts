import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { formatFcfa, splitPayment } from "@/lib/payments/split";
import { PACKS } from "@/lib/content/defaults";

describe("format des montants : point comme séparateur de milliers", () => {
  it.each([[0, "0 FCFA"], [999, "999 FCFA"], [1000, "1.000 FCFA"], [10000, "10.000 FCFA"], [20000, "20.000 FCFA"], [37500, "37.500 FCFA"], [40000, "40.000 FCFA"], [75000, "75.000 FCFA"], [120000, "120.000 FCFA"], [1000000, "1.000.000 FCFA"], [2500000, "2.500.000 FCFA"]])("%i → %s", (n, out) => expect(formatFcfa(n)).toBe(out));
  it("jamais d'espace dans le nombre lui-même (une seule espace, avant FCFA)", () => {
    for (const n of [1000, 37500, 120000, 1234567]) expect(formatFcfa(n).split(" ")).toHaveLength(2);
  });
  it("les 4 packs et leurs deux échéances s'affichent au bon format", () => {
    const shown = PACKS.flatMap((p) => { const s = splitPayment(p.price); return [p.price, s.first, s.balance].map(formatFcfa); });
    expect(shown).toEqual(["20.000 FCFA", "10.000 FCFA", "10.000 FCFA", "40.000 FCFA", "20.000 FCFA", "20.000 FCFA", "75.000 FCFA", "37.500 FCFA", "37.500 FCFA", "120.000 FCFA", "60.000 FCFA", "60.000 FCFA"]);
  });
});

describe("cohérence : un seul formatage dans tout le site", () => {
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = walk(path.resolve(__dirname, "../src")).filter((f) => /\.tsx?$/.test(f) && !f.endsWith("payments/split.ts"));
  it("aucun autre formatage de nombre ne produit d'espaces (Intl fr-FR)", () => {
    const bad = files.filter((f) => /NumberFormat\(\s*["']fr/.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(process.cwd(), f));
    expect(bad).toEqual([]);
  });
  it("aucun montant en dur écrit avec des espaces (ex. « 2 000 000 FCFA »)", () => {
    const bad = files.filter((f) => /\d \d{3}( \d{3})? FCFA/.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(process.cwd(), f));
    expect(bad).toEqual([]);
  });
});
