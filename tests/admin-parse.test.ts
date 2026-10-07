import { describe, expect, it } from "vitest";
import { parseFeatures, parseLines, parseLinks, linksToText, featuresToText } from "@/lib/admin/parse";

describe("analyse des champs d'administration", () => {
  it("lignes : trim, vides ignorées, bornées", () => {
    expect(parseLines(" a \r\n\n b ")).toEqual(["a", "b"]);
    expect(parseLines("x\n".repeat(100), 5)).toHaveLength(5);
  });
  it("fonctionnalités avec ou sans catégorie", () => {
    expect(parseFeatures("Analyse | Profil\nSans catégorie")).toEqual([{ category: "Analyse", label: "Profil" }, { category: "Général", label: "Sans catégorie" }]);
    expect(parseFeatures("Analyse |")).toEqual([]);
  });
  it("liens : https uniquement", () => {
    const ok = parseLinks("Campus | https://example.org/page");
    expect(ok).toEqual({ ok: true, links: [{ label: "Campus", url: "https://example.org/page" }] });
    for (const bad of ["x | http://example.org", "javascript:alert(1)", "x | ftp://a.b", "pas un lien", "x | //evil.com"]) expect(parseLinks(bad).ok).toBe(false);
  });
  it("aller-retour texte", () => {
    const l = [{ label: "A", url: "https://a.test/" }];
    expect(parseLinks(linksToText(l))).toEqual({ ok: true, links: l });
    const f = [{ category: "X", label: "Y" }];
    expect(parseFeatures(featuresToText(f))).toEqual(f);
  });
});
