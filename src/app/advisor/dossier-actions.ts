"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES } from "@/lib/applications/transitions";

const SAFE = ["Accès refusé", "Établissement et formation obligatoires", "Transition interdite", "La date doit être dans le futur", "Durée invalide", "Le lien doit commencer par https://", "pas encore eu lieu", "Statut invalide"];
const uuid = z.string().uuid();
const back = (sid: string, k: "ok" | "erreur", t: string): never => redirect(`/advisor/etudiants/${sid}?${k}=${encodeURIComponent(t)}`);
const msg = (m: string) => SAFE.find((s) => m.includes(s)) ?? "Une erreur est survenue.";

export async function createApplication(form: FormData) {
  await requireRole(["advisor", "admin"]);
  const p = z.object({ studentId: uuid, institution: z.string().trim().min(2).max(150), program: z.string().trim().min(2).max(150), country: uuid.or(z.literal("")), year: z.string().trim().max(20) }).safeParse(Object.fromEntries(form));
  const sid = String(form.get("studentId"));
  if (!p.success || !uuid.safeParse(sid).success) return uuid.safeParse(sid).success ? back(sid, "erreur", "Établissement et formation obligatoires") : redirect("/advisor/etudiants");
  const { error } = await (await createClient()).rpc("staff_create_application", { p_student: p.data.studentId, p_institution_name: p.data.institution, p_program_name: p.data.program, p_country: p.data.country || null, p_year: p.data.year });
  if (error) return back(sid, "erreur", msg(error.message));
  revalidatePath(`/advisor/etudiants/${sid}`);
  return back(sid, "ok", "Candidature ajoutée.");
}

export async function moveApplication(form: FormData) {
  await requireRole(["advisor", "admin"]);
  const sid = String(form.get("studentId"));
  if (!uuid.safeParse(sid).success) return redirect("/advisor/etudiants");
  const p = z.object({ id: uuid, to: z.enum(APPLICATION_STATUSES), note: z.string().trim().max(200).optional() }).safeParse({ id: form.get("id"), to: form.get("to"), note: form.get("note") || undefined });
  if (!p.success) return back(sid, "erreur", "Demande invalide.");
  const { error } = await (await createClient()).rpc("staff_move_application", { p_app: p.data.id, p_to: p.data.to, p_note: p.data.note ?? null });
  if (error) return back(sid, "erreur", msg(error.message));
  revalidatePath(`/advisor/etudiants/${sid}`);
  return back(sid, "ok", "Statut mis à jour.");
}

export async function createAppointment(form: FormData) {
  await requireRole(["advisor", "admin"]);
  const sid = String(form.get("studentId"));
  if (!uuid.safeParse(sid).success) return redirect("/advisor/etudiants");
  const p = z.object({ when: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/), duration: z.coerce.number().int().min(10).max(180), kind: z.string().trim().min(2).max(60), url: z.string().trim().max(300).optional() }).safeParse(Object.fromEntries(form));
  if (!p.success) return back(sid, "erreur", "Date, durée ou type invalide.");
  // Dakar est à UTC+0 toute l'année : l'heure saisie est enregistrée telle quelle en UTC.
  const { error } = await (await createClient()).rpc("staff_create_appointment", { p_student: sid, p_starts_at: `${p.data.when}:00Z`, p_duration: p.data.duration, p_kind: p.data.kind, p_url: p.data.url || null, p_notes: null });
  if (error) return back(sid, "erreur", msg(error.message));
  revalidatePath(`/advisor/etudiants/${sid}`);
  return back(sid, "ok", "Rendez-vous créé.");
}

export async function setAppointmentStatus(form: FormData) {
  await requireRole(["advisor", "admin"]);
  const sid = String(form.get("studentId"));
  if (!uuid.safeParse(sid).success) return redirect("/advisor/etudiants");
  const p = z.object({ id: uuid, status: z.enum(["confirmed", "done", "cancelled", "no_show"]) }).safeParse({ id: form.get("id"), status: form.get("status") });
  if (!p.success) return back(sid, "erreur", "Demande invalide.");
  const { error } = await (await createClient()).rpc("staff_set_appointment_status", { p_id: p.data.id, p_status: p.data.status });
  if (error) return back(sid, "erreur", msg(error.message));
  revalidatePath(`/advisor/etudiants/${sid}`);
  return back(sid, "ok", "Rendez-vous mis à jour.");
}

export async function setStep(form: FormData) {
  await requireRole(["advisor", "admin"]);
  const sid = String(form.get("studentId"));
  if (!uuid.safeParse(sid).success) return redirect("/advisor/etudiants");
  const p = z.object({ code: z.enum(["visa", "depart"]), status: z.enum(["todo", "in_progress", "done"]) }).safeParse({ code: form.get("code"), status: form.get("status") });
  if (!p.success) return back(sid, "erreur", "Demande invalide.");
  const { error } = await (await createClient()).rpc("staff_set_step", { p_student: sid, p_code: p.data.code, p_status: p.data.status });
  if (error) return back(sid, "erreur", error.message.includes("pas encore défini") ? "Le projet de l'étudiant n'est pas encore défini." : msg(error.message));
  revalidatePath(`/advisor/etudiants/${sid}`);
  return back(sid, "ok", "Étape mise à jour.");
}
