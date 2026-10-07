// Exécuté avant `next build` (script « prebuild »). Bloque un déploiement de PRODUCTION mal configuré.
import { checkEnv, isStrict } from "./env-rules.mjs";

const { errors } = checkEnv(process.env);
if (errors.length === 0) { console.log("✓ Variables d'environnement valides."); process.exit(0); }

const strict = isStrict(process.env);
console.log(`${strict ? "✗" : "⚠"} Configuration incomplète :`);
for (const e of errors) console.log(`  - ${e}`);
if (strict) { console.log("\nBuild de production arrêté. Corrigez les variables dans Vercel → Settings → Environment Variables."); process.exit(1); }
console.log("\n(Avertissement seulement : hors production, le site fonctionne en mode dégradé.)");
