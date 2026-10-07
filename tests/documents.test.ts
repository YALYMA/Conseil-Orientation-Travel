import { describe, expect, it } from "vitest";
import { validateUpload, sanitizeFileName, matchesSignature } from "@/lib/documents/validate";

describe("validation des documents", () => {
  it("accepte un PDF valide", () => {
    expect(validateUpload({ name: "Relevé 2024.pdf", type: "application/pdf", size: 1_000_000 }).ok).toBe(true);
  });
  it("refuse un type interdit", () => {
    expect(validateUpload({ name: "virus.exe", type: "application/x-msdownload", size: 100 }).ok).toBe(false);
  });
  it("refuse une taille excessive", () => {
    expect(validateUpload({ name: "a.pdf", type: "application/pdf", size: 11 * 1024 * 1024 }, 10).ok).toBe(false);
  });
  it("refuse un fichier vide", () => {
    expect(validateUpload({ name: "a.pdf", type: "application/pdf", size: 0 }).ok).toBe(false);
  });
  it("refuse une extension qui ne correspond pas au MIME", () => {
    expect(validateUpload({ name: "a.exe", type: "application/pdf", size: 100 }).ok).toBe(false);
  });
  it("neutralise les noms dangereux", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("C:\\x\\Diplôme final.pdf")).toBe("Diplome-final.pdf");
    expect(sanitizeFileName("..hidden")).not.toMatch(/^\./);
  });
  it("vérifie la signature binaire", () => {
    expect(matchesSignature("application/pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe(true);
    expect(matchesSignature("application/pdf", new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBe(false);
  });
});
