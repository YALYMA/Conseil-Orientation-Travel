# ARCHITECTURE_PLAN — Conseil-Orientation-Travel

## 1. Sources analysées
- Master Prompt (message) = spécification fonctionnelle. Le ZIP contient une version antérieure du prompt, des docs PRD/SECURITY/DATABASE/DEPLOYMENT, `.env.example`, notes de seed et le mockup.
- Mockup (identique à l'image jointe) = référence visuelle : hero navy + photo, cartes pays, packs, détail pack, bloc Wave/WhatsApp, dashboards étudiant/admin, mobile, footer navy.
- Arbitrage : en cas d'écart, prompt > mockup (fonctionnel), mockup > prompt (visuel).

## 2. Écarts mockup ↔ prompt (décisions)
| Point | Mockup | Décision |
|---|---|---|
| Hero « …jusqu'à l'admission » | promesse implicite | Reformulé : pas de promesse d'admission (§3 du prompt) |
| « +500 étudiants accompagnés » | chiffre affiché | Retiré par défaut ; stat configurable via `site_settings` tant que non vérifiable |
| Témoignage « Aminata Diop » | fictif | Marqué « exemple » dans le seed, masqué en prod tant que non remplacé |
| Numéro Wave `+221 11 44 67` | factice | Jamais codé en dur : `site_settings` / env |
| Stripe dans « Technologies » | hors périmètre | Ignoré (Wave manuel) |
| Dates 2025 dans le footer | — | Année dynamique |

## 3. Stack
Next.js (App Router) · TypeScript strict · Tailwind v4 · Supabase (Auth, Postgres, Storage privé) · Zod · Vitest · lucide-react.
Polices : next/font (auto-hébergées). Palette du prompt exposée en tokens Tailwind.

## 4. Structure
```
src/
  app/
    (public)/            accueil, pays/[slug], packs, packs/[slug], orientation, comment-ca-marche, a-propos, blog, faq, contact, légal
    (auth)/              connexion, inscription
    app/                 espace étudiant (dashboard, profil, projet, formations, candidatures, documents, paiements, rendez-vous, messages, notifications, paramètres)
    advisor/             espace conseiller
    admin/               back-office
    api/                 route handlers (upload, signed URL, webhooks futurs)
    sitemap.ts robots.ts
  components/ui/         design system unique (Button, Card, Badge, Input, …)
  components/{public,student,staff}/
  lib/
    supabase/            client navigateur, serveur (cookies), admin (service role, server-only)
    auth/                getSessionProfile, requireRole
    payments/            calcul 50/50, machine à états, liens WhatsApp/Wave
    documents/           validation MIME/taille/nom
    applications/        transitions de statut
    orientation/         scoring du questionnaire
    validators/          schémas Zod
  middleware (proxy)     rafraîchissement de session + garde des routes /app /advisor /admin
supabase/
  migrations/            schéma, index, RLS, storage policies, fonctions
  seed.sql               données fictives uniquement
tests/                   paiement, workflow, documents, permissions, candidatures
```

## 5. Rôles et permissions
- `student` : ses lignes uniquement (`student_id = auth.uid()`).
- `advisor` : étudiants dont `students.advisor_id = auth.uid()`.
- `admin` : tout.
- Le rôle est stocké dans `profiles.role` (non modifiable par l'utilisateur : policy + trigger). Les helpers SQL `is_admin()`, `is_advisor_of(student)` sont `SECURITY DEFINER` pour éviter la récursion RLS.
- Contrôle serveur systématique (`requireRole`) en plus de la RLS ; jamais de confiance au front.

## 6. Paiement (règles critiques)
- Prix lus **côté serveur** depuis `service_packs` ; montants des deux échéances calculés par `splitPayment(total)` et figés dans `orders`/`payments` à la création.
- Une preuve (`payment_proofs`) ne change jamais le statut en « confirmé » : seule une action staff le fait, journalisée dans `audit_logs`.
- Machine à états : `ORDER_CREATED → FIRST_PAYMENT_PENDING → FIRST_PAYMENT_PROOF_SUBMITTED → FIRST_PAYMENT_UNDER_REVIEW → FIRST_PAYMENT_CONFIRMED → SERVICE_ACTIVE → SERVICE_IN_PROGRESS → SERVICE_READY_FOR_FINAL_PAYMENT → BALANCE_PROOF_SUBMITTED → BALANCE_CONFIRMED → COMPLETED` ; latéraux `REJECTED`, `CANCELLED` (raison obligatoire).
- Arrondi : si le total est impair, le solde absorbe le reliquat (premier = floor(total/2)).

## 7. Documents
Bucket privé `documents`, chemin `{student_id}/{uuid}-{nom-sûr}`, types PDF/JPG/PNG (+ DOCX pour CV), taille ≤ `NEXT_PUBLIC_STORAGE_MAX_MB`, URL signée courte (60 s) générée côté serveur après vérification des droits, versions dans `document_versions`.

## 8. Contenus administrables (pas en dur)
Pays, procédures, formations, packs, fonctionnalités de pack, services exclus (par pack), FAQ, blog, témoignages, coordonnées Wave/WhatsApp. Champ `official_url` partout où une procédure officielle est évoquée. Aucune affiliation revendiquée (Campus France, ambassades, universités).

## 9. Ambiguïtés → choix raisonnables (configurables)
1. Pack Audit : « dépôt candidature » = « Selon pack » → champ texte dans `pack_features`.
2. Durées indicatives, nombre de candidatures incluses : colonnes nullable sur `service_packs`, valeurs d'exemple dans le seed.
3. Tranches de budget du test : 5 tranches en FCFA, éditables via `orientation_questions.options`.
4. Messagerie sans temps réel au MVP (rafraîchissement + Supabase Realtime en option).
5. Emails : abstraction `sendEmail()` no-op si `EMAIL_PROVIDER_API_KEY` absent.
6. Comptes démo : script de seed séparé, refusé si `NODE_ENV=production`.
7. Rate limiting des formulaires publics : table `rate_limits` + helper (pas de service externe au MVP).
8. Textes légaux : gabarits marqués « à faire valider par un juriste ».

## 10. Plan de phases
0 Analyse (ce document) → 1 Foundation → 2 Database + RLS + seed → 3 Site public → 4 Espace étudiant → 5 Conseiller → 6 Admin → 7 Workflow paiement → 8 QA → 9 Production.
Chaque phase se termine par : lint, typecheck, tests, et un compte rendu (objectif, travail, fichiers, tests, erreurs corrigées, suite).
