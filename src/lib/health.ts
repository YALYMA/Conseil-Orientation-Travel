export interface HealthInput {
  env: Record<string, string | undefined>;
  /** Résultat d'une lecture publique de la base : "ok", "error", ou "skipped" si Supabase n'est pas configuré. */
  database: "ok" | "error" | "skipped";
}
export interface HealthReport { status: "ok" | "degraded"; checks?: Record<string, boolean | string> }

/** Sans jeton valide : statut seul (aucune information sur la configuration). */
export function evaluateHealth({ env, database }: HealthInput, detailed: boolean): HealthReport {
  const set = (k: string) => typeof env[k] === "string" && env[k]!.trim() !== "";
  const checks = {
    supabaseUrl: set("NEXT_PUBLIC_SUPABASE_URL"), supabaseAnonKey: set("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: set("SUPABASE_SERVICE_ROLE_KEY"), rateLimitSalt: set("RATE_LIMIT_SALT"), appUrl: set("NEXT_PUBLIC_APP_URL"), database,
  };
  const ok = Object.entries(checks).every(([k, v]) => (k === "database" ? v === "ok" : v === true));
  return { status: ok ? "ok" : "degraded", ...(detailed ? { checks } : {}) };
}
