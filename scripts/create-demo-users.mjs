// Comptes de DÉMONSTRATION fictifs. Refuse de s'exécuter en production.
// Usage : NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-demo-users.mjs
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_USERS !== "yes") {
  console.error("Refusé : définissez ALLOW_DEMO_USERS=yes sur un projet de TEST (jamais en production).");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis."); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const users = [
  { email: "etudiant.demo@example.test", name: "Abdoulaye Fall (fictif)", role: "student" },
  { email: "conseiller.demo@example.test", name: "Conseiller Démo (fictif)", role: "advisor" },
  { email: "admin.demo@example.test", name: "Admin Démo (fictif)", role: "admin" },
];
const ids = {};
for (const u of users) {
  const password = randomBytes(12).toString("base64url"); // aléatoire, affiché une seule fois
  const { data, error } = await sb.auth.admin.createUser({ email: u.email, password, email_confirm: true, user_metadata: { full_name: u.name } });
  if (error) { console.error(u.email, "→", error.message); continue; }
  ids[u.role] = data.user.id;
  if (u.role !== "student") {
    await sb.from("profiles").update({ role: u.role }).eq("id", data.user.id);
    if (u.role === "advisor") await sb.from("advisors").insert({ id: data.user.id });
  }
  console.log(`${u.role.padEnd(8)} ${u.email}  mot de passe : ${password}`);
}
if (ids.student && ids.advisor) await sb.from("students").update({ advisor_id: ids.advisor }).eq("id", ids.student);
console.log("Terminé. Supprimez ces comptes avant toute ouverture au public.");
