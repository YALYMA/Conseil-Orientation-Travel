/** En-têtes de sécurité appliqués à toutes les routes (voir next.config.ts). Pur, donc testable. */
export function buildCsp(opts: { supabaseUrl?: string; dev?: boolean }): string {
  const supa = (() => { try { return opts.supabaseUrl ? new URL(opts.supabaseUrl) : null; } catch { return null; } })();
  const connect = ["'self'", ...(supa ? [supa.origin, `wss://${supa.host}`] : [])];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-inline' : nécessaire aux scripts en ligne de Next.js sans nonce (limite connue, voir SECURITY.md).
    "script-src": ["'self'", "'unsafe-inline'", ...(opts.dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": connect,
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };
  return Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`).join("; ");
}

export function securityHeaders(opts: { supabaseUrl?: string; dev?: boolean }): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: buildCsp(opts) },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ];
}
