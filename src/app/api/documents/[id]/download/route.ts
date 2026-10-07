import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/** Redirige vers une URL signée de 60 s. Les droits sont vérifiés par la RLS (propriétaire / conseiller assigné / admin). */
export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse("Introuvable", { status: 404 });
  if (!isSupabaseConfigured) return new NextResponse("Service indisponible", { status: 503 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Connexion requise", { status: 401 });

  const { data: doc } = await supabase.from("documents").select("current_version").eq("id", id).single(); // RLS
  if (!doc) return new NextResponse("Introuvable", { status: 404 });
  const { data: ver } = await supabase.from("document_versions").select("storage_path").eq("document_id", id).eq("version", doc.current_version).single();
  if (!ver) return new NextResponse("Introuvable", { status: 404 });

  // Traçabilité d'abord : si la consultation ne peut pas être journalisée, aucun lien n'est délivré.
  const { error: logError } = await supabase.rpc("log_document_access", { p_document: id });
  if (logError) return new NextResponse(logError.message.includes("Accès refusé") ? "Introuvable" : "Service indisponible", { status: logError.message.includes("Accès refusé") ? 404 : 503 });

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(ver.storage_path, 60);
  if (!signed) return new NextResponse("Introuvable", { status: 404 });
  const res = NextResponse.redirect(signed.signedUrl, 302);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
