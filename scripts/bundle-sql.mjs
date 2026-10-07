// Concatène les migrations en UN fichier à coller dans le SQL Editor de Supabase.
// Usage : npm run sql:bundle   (un test vérifie que supabase/setup.sql est à jour)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "supabase", "migrations");

export function buildBundle() {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const parts = files.map((f) => `-- ════════════════════════════════════════════════════════════\n-- ${f}\n-- ════════════════════════════════════════════════════════════\n${fs.readFileSync(path.join(dir, f), "utf8").trimEnd()}\n`);
  return `-- Conseil-Orientation-Travel — installation complète de la base (${files.length} migrations).\n-- FICHIER GÉNÉRÉ par « npm run sql:bundle » : ne pas modifier à la main.\n-- À exécuter UNE SEULE FOIS sur un projet Supabase vide, puis supabase/seed.sql.\n\n${parts.join("\n")}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.join(root, "supabase", "setup.sql");
  fs.writeFileSync(out, buildBundle());
  console.log(`✓ ${path.relative(root, out)} écrit.`);
}
