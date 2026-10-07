/** Vercel refuse les corps de requête > 4,5 Mo : on plafonne à 4 Mo pour garder de la marge (multipart). */
export const MAX_UPLOAD_MB = 4;
export function parseStorageMaxMb(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_UPLOAD_MB) : MAX_UPLOAD_MB;
}

/** Variables publiques uniquement. Les secrets restent dans lib/supabase/admin.ts (server-only). */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "Conseil-Orientation-Travel",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  storageMaxMb: parseStorageMaxMb(process.env.NEXT_PUBLIC_STORAGE_MAX_MB),
};

export const isSupabaseConfigured = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
