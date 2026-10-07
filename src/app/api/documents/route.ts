import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { matchesSignature, validateUpload } from "@/lib/documents/validate";
import { allowAll } from "@/lib/security/rate-limit";
import { DOCUMENT_CATEGORIES } from "@/lib/documents/categories";

const meta = z.object({
  category: z.enum(DOCUMENT_CATEGORIES),
  name: z.string().trim().min(2).max(120),
  documentId: z.string().uuid().optional(),
});
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return fail("Service indisponible.", 503);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Connexion requise.", 401);
  if (!(await allowAll([[`upload:user:${auth.user.id}`, 30, 3600]]))) return fail("Trop de dépôts. Réessayez plus tard.", 429);

  const max = publicEnv.storageMaxMb;
  if (Number(req.headers.get("content-length") ?? 0) > (max + 1) * 1024 * 1024) return fail(`Le fichier dépasse ${max} Mo.`, 413);

  let form: FormData;
  try { form = await req.formData(); } catch { return fail("Requête invalide.", 400); }
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Aucun fichier reçu.", 400);
  const m = meta.safeParse({ category: form.get("category"), name: form.get("name"), documentId: form.get("documentId") || undefined });
  if (!m.success) return fail("Catégorie ou nom invalide.", 400);

  const check = validateUpload({ name: file.name, type: file.type, size: file.size }, max);
  if (!check.ok) return fail(check.error, 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(file.type, bytes.slice(0, 8))) return fail("Le contenu du fichier ne correspond pas à son type.", 400);

  // Chemin imposé par le serveur : {user}/{uuid}-{nom sûr}. La politique de stockage exige ce dossier.
  const path = `${auth.user.id}/${randomUUID()}-${check.safeName}`;
  const up = await supabase.storage.from("documents").upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) return fail("Échec du téléversement.", 500);

  const { data, error } = await supabase.rpc("register_document_upload", {
    p_category: m.data.category, p_name: m.data.name, p_path: path, p_mime: file.type, p_size: file.size, p_document: m.data.documentId ?? null,
  });
  if (error) {
    await supabase.storage.from("documents").remove([path]); // pas de fichier orphelin
    const known = ["Réservé aux étudiants", "validé ne peut pas", "Document introuvable"].find((k) => error.message.includes(k));
    return fail(known ? error.message : "Impossible d'enregistrer le document.", 400);
  }
  return NextResponse.json({ id: data });
}
