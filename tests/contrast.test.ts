import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/** Garde-fou d'accessibilité (WCAG 2.1 AA : 4,5:1 pour le texte courant). Lit les vrais tokens de globals.css. */
const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
const token = (n: string) => { const m = css.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`)); if (!m) throw new Error(`token --${n} introuvable`); return m[1]; };
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]: number[]) => { const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (fg: number[], bg: number[], a: number) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));

const white = rgb("#ffffff"), surface = rgb(token("background")), soft = rgb(token("light-blue")), navy = rgb(token("navy"));

describe("contraste des couleurs (WCAG AA)", () => {
  it.each([["blanc", white], ["fond de page", surface], ["bleu clair", soft]])("texte secondaire (navy/75) lisible sur %s", (_, bg) => {
    expect(ratio(over(navy, bg, 0.75), bg)).toBeGreaterThanOrEqual(4.5);
  });
  it("texte blanc translucide (≥ 70 %) lisible sur le navy du pied de page", () => expect(ratio(over(white, navy, 0.7), navy)).toBeGreaterThanOrEqual(4.5));
  it("texte blanc (90 %) lisible sur l'extrémité claire du dégradé de marque (cartes, bannières)", () => {
    const end = rgb("#0a56cf");
    expect(ratio(white, end)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(over(white, end, 0.9), end)).toBeGreaterThanOrEqual(4.5);
  });
  it("blanc sur bleu principal (boutons)", () => expect(ratio(white, rgb(token("blue")))).toBeGreaterThanOrEqual(4.5));
  it("navy sur or (boutons d'appel à l'action)", () => expect(ratio(navy, rgb(token("gold")))).toBeGreaterThanOrEqual(4.5));
  it("vert « encre » (texte, boutons de validation) sur blanc", () => expect(ratio(rgb(token("green-ink")), white)).toBeGreaterThanOrEqual(4.5));
  it("blanc sur vert « encre » (bouton success)", () => expect(ratio(white, rgb(token("green-ink")))).toBeGreaterThanOrEqual(4.5));
  it("rouge d'erreur sur blanc et sur fond d'erreur", () => {
    expect(ratio(rgb(token("red")), white)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(rgb(token("red")), rgb("#fde8e8"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("pas de classes de texte à faible contraste dans le code", () => {
  const files: string[] = [];
  const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx$/.test(e.name) && files.push(path.join(d, e.name))));
  walk(path.join(root, "src"));
  const src = files.map((f) => [path.relative(root, f), fs.readFileSync(f, "utf8")] as const);

  it("aucun text-navy/<75 (placeholder ≥ 70 ; glyphes décoratifs aria-hidden exemptés)", () => {
    const bad = src.flatMap(([f, s]) => s.split("\n").map((l, i) => [f, i + 1, l] as const)
      .filter(([, , l]) => !/aria-hidden/.test(l) && [...l.matchAll(/(placeholder:)?text-navy\/(\d+)/g)].some((m) => Number(m[2]) < (m[1] ? 70 : 75)))
      .map(([f, n]) => `${f}:${n}`));
    expect(bad).toEqual([]);
  });
  it("aucun texte blanc translucide sous 70 % (hors décor aria-hidden)", () => {
    const bad = src.flatMap(([f, s]) => s.split("\n").map((l, i) => [f, i + 1, l] as const)
      .filter(([, , l]) => !/aria-hidden|<(Rings|DotGrid|Blob|Wave)\b/.test(l) && [...l.matchAll(/(?<![\w:-])text-white\/(\d+)/g)].some((m) => Number(m[1]) < 70))
      .map(([f, n]) => `${f}:${n}`));
    expect(bad).toEqual([]);
  });
  it("aucun text-success / bg-success porteur de texte (utiliser success-ink) hors glyphes aria-hidden", () => {
    const bad = src.flatMap(([f, s]) => s.split("\n").map((l, i) => [f, i + 1, l] as const).filter(([, , l]) => /(text|bg)-success(?!-ink)\b/.test(l) && !/aria-hidden/.test(l)).map(([f, n]) => `${f}:${n}`));
    expect(bad).toEqual([]);
  });
});
