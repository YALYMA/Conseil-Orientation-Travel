import { describe, expect, it } from "vitest";
import { signFlash, verifyFlash } from "@/lib/flash-core";

const SECRET = "0123456789abcdefSECRET";
describe("messages flash : forme canonique unique", () => {
  const token = signFlash(SECRET, "erreur", "Message légitime");
  it("le jeton légitime est accepté", () => expect(verifyFlash(SECRET, "erreur", token)).toBe("Message légitime"));
  it("un caractère ajouté à la signature est refusé", () => {
    for (const extra of ["x", "A", "=", "-", "_"]) expect(verifyFlash(SECRET, "erreur", token + extra)).toBeUndefined();
  });
  it("signature tronquée, contenu modifié, mauvais type ou mauvais secret : refusés", () => {
    expect(verifyFlash(SECRET, "erreur", token.slice(0, -1))).toBeUndefined();
    expect(verifyFlash(SECRET, "erreur", "A" + token.slice(1))).toBeUndefined();
    expect(verifyFlash(SECRET, "ok", token)).toBeUndefined();
    expect(verifyFlash("autre-secret-0123456789", "erreur", token)).toBeUndefined();
  });
  it("texte libre, vide ou sans secret : refusés", () => {
    for (const bad of ["Appelez le 77 000 00 00", "", "a.b", "a.b.c"]) expect(verifyFlash(SECRET, "erreur", bad)).toBeUndefined();
    expect(verifyFlash(null, "erreur", token)).toBeUndefined();
  });
  it("un jeton expiré est refusé", () => expect(verifyFlash(SECRET, "erreur", token, Date.now() + 10 * 60_000)).toBeUndefined());
});
