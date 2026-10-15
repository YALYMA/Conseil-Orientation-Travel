"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "@/lib/payments/workflow";
import { staffActionsFor } from "@/lib/payments/staff-actions";
import { flashRedirect } from "@/lib/flash";

const schema = z.object({
  orderId: z.string().uuid(),
  to: z.enum(ORDER_STATUSES),
  reason: z.string().trim().max(500).optional(),
});

const SAFE = ["Une raison est obligatoire", "Transition interdite", "Accès refusé", "Commande introuvable"];

export async function staffTransition(form: FormData) {
  const me = await requireRole(["advisor", "admin"]);
  const p = schema.safeParse({ orderId: form.get("orderId"), to: form.get("to"), reason: form.get("reason") || undefined });
  if (!p.success) flashRedirect("/advisor/paiements", "erreur", "Demande invalide.");
  const supabase = await createClient();
  // Défense en profondeur : la base re-vérifie rôle, assignation et transition.
  const { data: cur } = await supabase.from("orders").select("status").eq("id", p.data.orderId).single();
  const allowed = cur && staffActionsFor(cur.status, me.role as "advisor" | "admin").some((a) => a.to === p.data.to);
  if (!allowed) flashRedirect("/advisor/paiements", "erreur", "Action non disponible pour cette commande.");
  const { error } = await supabase.rpc("staff_transition", { p_order: p.data.orderId, p_to: p.data.to, p_reason: p.data.reason ?? null });
  if (error) flashRedirect("/advisor/paiements", "erreur", SAFE.find((s) => error.message.includes(s)) ?? "Une erreur est survenue.");
  revalidatePath("/advisor", "layout");
  redirect("/advisor/paiements");
}
