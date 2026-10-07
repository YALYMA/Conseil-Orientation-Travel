import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, hashKey } from "./keys";

export type Check = readonly [bucket: string, limit: number, windowSeconds: number];

/**
 * Compte chaque tentative et renvoie false dès qu'une limite est dépassée.
 * Choix assumé : si le service de limitation est indisponible (clé de service absente, base injoignable) on laisse passer
 * et on journalise l'erreur, pour qu'une panne de la limitation ne verrouille pas tous les utilisateurs.
 */
export async function allowAll(checks: Check[]): Promise<boolean> {
  try {
    const sb = createAdminClient();
    let ok = true;
    for (const [bucket, limit, windowSeconds] of checks) {
      const { data, error } = await sb.rpc("rate_limit_hit", { p_bucket: bucket, p_limit: limit, p_window_seconds: windowSeconds });
      if (error) throw new Error(error.message);
      if (data !== true) ok = false;
    }
    return ok;
  } catch (e) {
    console.error("[rate-limit] indisponible, requête autorisée :", e instanceof Error ? e.message : e);
    return true;
  }
}

export const requestIpHash = async () => hashKey(clientIp(await headers()));
export const TOO_MANY = "Trop de tentatives. Réessayez dans quelques minutes.";
