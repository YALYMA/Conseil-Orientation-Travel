import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Indiquez votre nom complet.").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,18}$/, "Numéro de téléphone invalide."),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  password: z.string().min(10, "10 caractères minimum.").max(128),
  terms: z.literal("on", { message: "Vous devez accepter les CGU et la politique de confidentialité." }),
});

/** Évite les redirections ouvertes : uniquement un chemin interne. */
export function safeNext(next: unknown): string | null {
  return typeof next === "string" && /^\/(?!\/)[\w\-/?=&.]*$/.test(next) ? next : null;
}

export const resetRequestSchema = z.object({ email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.") });

export const newPasswordSchema = z
  .object({ password: z.string().min(10, "10 caractères minimum.").max(128, "128 caractères maximum."), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas." });
