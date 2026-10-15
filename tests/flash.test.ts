import { describe, expect, it } from "vitest";
import { FLASH_TTL_MS, signFlash, verifyFlash } from "@/lib/flash-core";

const S = "secret-de-test-0123456789";

describe("messages flash signés (anti-usurpation de contenu)", () => {
  it("aller-retour, accents compris", () => {
    const t = signFlash(S, "erreur", "Paiement non validé : montant reçu incorrect é à ç");
    expect(verifyFlash(S, "erreur", t)).toBe("Paiement non validé : montant reçu incorrect é à ç");
  });
  it("un texte libre placé dans l'URL est REFUSÉ", () => {
    for (const forged of ["Renvoyez 37 500 FCFA au 77 000 00 00", "x.y", "a.b.c", "", ".", "..", "eyJ0IjoiaGFjayIsImUiOjk5OTk5OTk5OTk5OTl9.AAAA"])
      expect(verifyFlash(S, "erreur", forged)).toBeUndefined();
  });
  it("une signature fabriquée pour un autre secret est refusée", () => {
    expect(verifyFlash(S, "erreur", signFlash("autre-secret-0123456789ab", "erreur", "Faux"))).toBeUndefined();
  });
  it("un message ne peut pas être rejoué sous l'autre type (ok ↔ erreur)", () => {
    expect(verifyFlash(S, "ok", signFlash(S, "erreur", "Projet enregistré."))).toBeUndefined();
  });
  it("le contenu ne peut pas être modifié sans invalider la signature", () => {
    const [payload, sig] = signFlash(S, "ok", "Réglages enregistrés.").split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ t: "Autre texte", e: Date.now() + 1e6 })).toString("base64url");
    expect(verifyFlash(S, "ok", `${forgedPayload}.${sig}`)).toBeUndefined();
    expect(verifyFlash(S, "ok", `${payload}.${sig}`)).toBe("Réglages enregistrés.");
  });
  it("expire après 5 minutes", () => {
    const now = 1_700_000_000_000;
    const t = signFlash(S, "ok", "Vu.", now);
    expect(verifyFlash(S, "ok", t, now + FLASH_TTL_MS - 1)).toBe("Vu.");
    expect(verifyFlash(S, "ok", t, now + FLASH_TTL_MS + 1)).toBeUndefined();
  });
  it("sans secret (production mal configurée) rien n'est affiché ; types invalides tolérés", () => {
    expect(verifyFlash(null, "ok", signFlash(S, "ok", "x"))).toBeUndefined();
    for (const bad of [undefined, null, 42, {}, ["a"], "x".repeat(5000)]) expect(verifyFlash(S, "ok", bad)).toBeUndefined();
  });
  it("tronque les messages démesurés", () => {
    expect(verifyFlash(S, "ok", signFlash(S, "ok", "a".repeat(1000)))?.length).toBe(200);
  });
});
