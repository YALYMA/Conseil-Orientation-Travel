# Conseil-Orientation-Travel

Plateforme d'orientation et d'accompagnement aux études à l'étranger (étudiants sénégalais → France, Belgique, Luxembourg, Italie, Maroc).
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Auth, PostgreSQL + RLS, Storage privé) · Vercel.

**Déployer** : suivre `DEPLOYMENT.md`, puis dérouler `RECETTE.md`. État détaillé et limites : `STATUS.md`.

## Ce que fait la plateforme
- **Site public** : accueil, pays, packs et comparateur, test d'orientation, FAQ, contact, SEO (sitemap, robots, métadonnées).
- **Espace étudiant** : projet, commande de pack, **paiement en 2 étapes (50 % / 50 %)** via Wave manuel + preuve WhatsApp, documents privés, candidatures et historique, rendez-vous, messagerie, progression et prochaine étape.
- **Espace conseiller** : étudiants assignés, validation des paiements et documents, candidatures, rendez-vous, messages.
- **Administration** : packs et prix, pays et procédures (liens officiels), FAQ, réglages Wave/WhatsApp, utilisateurs et rôles, journal d'audit.
- **Sécurité** : RLS sur toutes les tables, règles de paiement/documents appliquées **en base**, bucket privé + URLs signées, limitation anti-abus, journal d'audit, en-têtes de sécurité.

Aucune promesse d'admission ou de visa. Aucune affiliation revendiquée avec Campus France, ambassades ou universités.

## Développement local
```bash
npm install
cp .env.example .env.local   # sans Supabase, le site public fonctionne en mode dégradé (contenu de repli)
npm run dev
```
| Commande | Rôle |
|---|---|
| `npm run check` | lint + typecheck + tests + build |
| `npm test` | 190+ tests (logique métier, RLS, paiements, documents… sur PostgreSQL en WASM) |
| `      ` | régénère `supabase/setup.sql` (installation en un fichier) |

## Base de données
`supabase/setup.sql` (8 migrations concaténées) puis `supabase/seed.sql` (données **fictives**). Voir `DATABASE.md`.

## Documentation
`DEPLOYMENT.md` · `RECETTE.md` · `SECURITY.md` · `DATABASE.md` · `ARCHITECTURE_PLAN.md` · `STATUS.md`
