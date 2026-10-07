import { describe, expect, it } from "vitest";
import { safeNext, signInSchema, signUpSchema } from "@/lib/validators/auth";

describe("validation auth", () => {
  it("normalise l'e-mail", () => expect(signInSchema.parse({ email: "  A@B.CO ", password: "x" }).email).toBe("a@b.co"));
  it("refuse un mot de passe court", () => {
    const r = signUpSchema.safeParse({ fullName: "Abdoulaye Fall", phone: "+221 77 000 00 00", email: "a@b.co", password: "court", terms: "on" });
    expect(r.success).toBe(false);
  });
  it("exige l'acceptation des CGU", () => {
    expect(signUpSchema.safeParse({ fullName: "Abdoulaye Fall", phone: "+221770000000", email: "a@b.co", password: "motdepasse-long" }).success).toBe(false);
  });
  it("accepte une inscription valide", () => {
    expect(signUpSchema.safeParse({ fullName: "Abdoulaye Fall", phone: "+221 77 000 00 00", email: "a@b.co", password: "motdepasse-long", terms: "on" }).success).toBe(true);
  });
  it("ne permet pas de choisir son rôle via le formulaire", () => {
    const r = signUpSchema.parse({ fullName: "Abdoulaye Fall", phone: "+221770000000", email: "a@b.co", password: "motdepasse-long", terms: "on", role: "admin" });
    expect("role" in r).toBe(false);
  });
  it("bloque les redirections ouvertes", () => {
    expect(safeNext("/app/dashboard")).toBe("/app/dashboard");
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil", "javascript:alert(1)", undefined]) expect(safeNext(bad)).toBeNull();
  });
});
