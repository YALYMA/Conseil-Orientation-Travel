"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { flashRedirect } from "@/lib/flash";

const schema = z.object({ id: z.string().uuid(), status: z.enum(["in_review", "validated", "to_fix", "rejected"]), comment: z.string().trim().max(500).optional() });
const SAFE = ["Une raison est obligatoire", "Accès refusé", "Aucun fichier à vérifier"];

export async function reviewDocument(form: FormData) {
  await requireRole(["advisor", "admin"]);
  const p = schema.safeParse({ id: form.get("id"), status: form.get("status"), comment: form.get("comment") || undefined });
  if (!p.success) flashRedirect("/advisor/documents", "erreur", "Demande invalide.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_document", { p_document: p.data.id, p_status: p.data.status, p_comment: p.data.comment ?? null });
  if (error) flashRedirect("/advisor/documents", "erreur", SAFE.find((s) => error.message.includes(s)) ?? "Une erreur est survenue.");
  revalidatePath("/advisor", "layout");
  redirect("/advisor/documents");
}
