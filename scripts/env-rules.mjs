// Règles de validation des variables d'environnement (importées par check-env.mjs et par les tests).
const need = (v) => typeof v === "string" && v.trim() !== "";

/** @param {Record<string, string | undefined>} env @returns {{ errors: string[], warnings: string[] }} */
export function checkEnv(env) {
  const errors = [];
  const add = (msg) => errors.push(msg);

  if (!need(env.NEXT_PUBLIC_SUPABASE_URL)) add("NEXT_PUBLIC_SUPABASE_URL est manquante (requise au build).");
  else if (!/^https:\/\/[^ ]+\.supabase\.(co|in)\/?$/.test(env.NEXT_PUBLIC_SUPABASE_URL.trim())) add("NEXT_PUBLIC_SUPABASE_URL doit ressembler à https://xxxx.supabase.co.");
  if (!need(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) add("NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante.");
  if (!need(env.SUPABASE_SERVICE_ROLE_KEY)) add("SUPABASE_SERVICE_ROLE_KEY est manquante (nécessaire à la limitation anti-abus).");
  else if (env.SUPABASE_SERVICE_ROLE_KEY === env.NEXT_PUBLIC_SUPABASE_ANON_KEY) add("SUPABASE_SERVICE_ROLE_KEY est identique à la clé anonyme : vérifiez que vous avez copié la clé « service_role ».");
  if (!need(env.NEXT_PUBLIC_APP_URL)) add("NEXT_PUBLIC_APP_URL est manquante.");
  else if (!/^https:\/\/[^ /]+/.test(env.NEXT_PUBLIC_APP_URL.trim()) || env.NEXT_PUBLIC_APP_URL.includes("localhost")) add("NEXT_PUBLIC_APP_URL doit être l'URL https publique (pas localhost).");
  if (!need(env.RATE_LIMIT_SALT) || env.RATE_LIMIT_SALT.trim().length < 16) add("RATE_LIMIT_SALT doit contenir au moins 16 caractères.");
  if (Object.keys(env).some((k) => k.startsWith("NEXT_PUBLIC_") && /SERVICE_ROLE|SECRET/i.test(k))) add("Une variable NEXT_PUBLIC_ contient « SERVICE_ROLE » ou « SECRET » : elle serait exposée au navigateur.");

  return { errors, warnings: [] };
}

/** Production Vercel : erreurs bloquantes. Autres environnements : simples avertissements. */
export const isStrict = (env) => env.VERCEL_ENV === "production" || env.ENFORCE_ENV_CHECK === "1";
