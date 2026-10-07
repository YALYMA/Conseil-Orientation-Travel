"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const BACK = /^\/(app\/messages|app\/rendez-vous|advisor\/etudiants\/[0-9a-f-]{36})$/;
const SAFE = ["Message vide ou trop long", "Accès refusé", "Rendez-vous introuvable", "ne peut plus être modifié", "Statut invalide"];
const to = (back: string, k: "ok" | "erreur", t: string): never => redirect(`${back}?${k}=${encodeURIComponent(t)}`);

export async function sendMessage(form: FormData) {
  await requireRole(["student", "advisor", "admin"]);
  const p = z.object({ conversationId: z.string().uuid(), body: z.string().trim().min(1).max(4000), back: z.string().regex(BACK) }).safeParse(Object.fromEntries(form));
  if (!p.success) return redirect("/app/messages?erreur=" + encodeURIComponent("Message vide ou trop long"));
  const { error } = await (await createClient()).rpc("send_message", { p_conversation: p.data.conversationId, p_body: p.data.body });
  if (error) return to(p.data.back, "erreur", SAFE.find((s) => error.message.includes(s)) ?? "Envoi impossible.");
  revalidatePath(p.data.back);
  return redirect(p.data.back);
}

export async function respondAppointment(form: FormData) {
  await requireRole(["student"]);
  const p = z.object({ id: z.string().uuid(), status: z.enum(["confirmed", "cancelled"]) }).safeParse(Object.fromEntries(form));
  if (!p.success) return to("/app/rendez-vous", "erreur", "Demande invalide.");
  const { error } = await (await createClient()).rpc("student_respond_appointment", { p_id: p.data.id, p_status: p.data.status });
  if (error) return to("/app/rendez-vous", "erreur", SAFE.find((s) => error.message.includes(s)) ?? "Action impossible.");
  revalidatePath("/app/rendez-vous");
  return to("/app/rendez-vous", "ok", p.data.status === "confirmed" ? "Rendez-vous confirmé." : "Rendez-vous annulé.");
}
