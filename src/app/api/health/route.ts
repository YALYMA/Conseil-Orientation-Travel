import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { evaluateHealth } from "@/lib/health";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

function tokenOk(given: string | null): boolean {
  const expected = process.env.HEALTH_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Diagnostic de déploiement. Public : statut seul. Avec ?token=HEALTH_TOKEN : détail booléen (jamais de valeurs). */
export async function GET(req: NextRequest) {
  let database: "ok" | "error" | "skipped" = "skipped";
  if (isSupabaseConfigured) {
    try {
      const { error } = await createPublicClient().from("site_settings").select("key").limit(1);
      database = error ? "error" : "ok";
    } catch { database = "error"; }
  }
  const report = evaluateHealth({ env: process.env, database }, tokenOk(req.nextUrl.searchParams.get("token")));
  return NextResponse.json(report, { status: report.status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
