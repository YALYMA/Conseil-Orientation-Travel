# Déploiement sur Vercel + Supabase

Durée estimée : 45 à 60 minutes la première fois. **Respectez l'ordre** : Supabase d'abord, Vercel ensuite
(le build lit la base ; sans base initialisée, il s'arrête avec un message explicite — c'est voulu).

> ⚠️ Cette application n'a **pas** été exécutée contre un vrai projet Supabase avant livraison. Le code, les
> migrations et la sécurité (RLS) sont testés sur PostgreSQL local. Faites impérativement la recette (`RECETTE.md`)
> avant d'ouvrir le site à de vrais étudiants.

## 0. Prérequis
- Comptes GitHub, Vercel, Supabase.
- Région conseillée : Supabase **Paris (eu-west-3)** et Vercel `cdg1` (déjà fixé dans `vercel.json`) : la plus proche du Sénégal parmi les régions européennes courantes.
- Plans : le plan gratuit Supabase **met le projet en pause après une période d'inactivité** et n'offre pas de sauvegardes planifiées ; le plan gratuit « Hobby » de Vercel est destiné à un usage non commercial. Pour un service payant avec des documents d'identité, prévoyez des plans payants (à confirmer dans les conditions actuelles des deux fournisseurs).

## 1. Supabase
1. Créer un projet (région Paris, mot de passe de base fort conservé dans un gestionnaire de mots de passe).
2. **Project Settings → API** : noter `Project URL`, clé `anon` (publique) et clé `service_role` (**secrète**).
3. **Authentication → Providers → Email** : activer « Confirm email ». Longueur minimale du mot de passe : 10. Activer la protection contre les mots de passe compromis si votre plan la propose.
4. **Authentication → URL Configuration** : *Site URL* = l'URL finale du site (ex. `https://votre-domaine.com`) ; *Redirect URLs* : `https://votre-domaine.com/**` (ajouter l'URL `*.vercel.app` du projet pour les tests).
5. **SQL Editor** : coller **tout** le contenu de `supabase/setup.sql`, exécuter. Puis coller `supabase/seed.sql`, exécuter.
   - Si une erreur de droits apparaît sur `storage.objects`, créez le bucket privé `documents` depuis *Storage*, puis ré-exécutez uniquement les `create policy ... on storage.objects` de la migration 2.
6. **Vérifier** : *Storage* → bucket `documents` = **Private** ; *Table Editor* → `service_packs` contient 4 lignes (20 000 / 40 000 / 75 000 / 120 000).

## 2. GitHub
```bash
git init && git add . && git commit -m "Conseil-Orientation-Travel v1.0.0"
git branch -M main
git remote add origin git@github.com:VOTRE-COMPTE/conseil-orientation-travel.git
git push -u origin main
```
`.env*` est ignoré : aucun secret n'est poussé. Vérifiez qu'aucun fichier `.env.local` n'apparaît dans `git status`.

## 3. Vercel
1. **Add New → Project** → importer le dépôt (framework Next.js détecté ; `vercel.json` fournit région et commandes).
2. **Environment Variables** (Production **et** Preview) :

| Variable | Valeur | Secret ? |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://votre-domaine.com` (ou l'URL `.vercel.app` pour un premier essai) | non |
| `NEXT_PUBLIC_SITE_NAME` | `Conseil-Orientation-Travel` | non |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `anon` | non |
| `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` | **OUI** |
| `RATE_LIMIT_SALT` | `openssl rand -hex 32` | **OUI** |
| `HEALTH_TOKEN` | chaîne aléatoire (facultatif) | oui |
| `NEXT_PUBLIC_STORAGE_MAX_MB` | `4` (facultatif ; plafonné à 4) | non |

3. **Deploy**. Le script `prebuild` vérifie ces variables : en production, un oubli **arrête** le build avec la liste des variables manquantes.
4. Si le build échoue avec « Lecture impossible : … (Supabase : …) » : le SQL n'a pas été exécuté, l'URL est fausse ou le projet est en pause.

## 4. Domaine personnalisé
1. Vercel → *Settings → Domains* → ajouter le domaine, créer les enregistrements DNS demandés (HTTPS automatique).
2. **Mettre à jour** `NEXT_PUBLIC_APP_URL` (nouveau domaine) et la *Site URL* Supabase, puis **redéployer** : l'URL et la CSP sont figées au build.

## 5. Premier administrateur
1. Sur le site : **Inscription**, confirmer l'e-mail.
2. Supabase → SQL Editor :
```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'ngisvoyage2023@gmail.com');
```
3. Se déconnecter / reconnecter : `/admin` est accessible. Créez ensuite les conseillers (inscription, puis *Admin → Utilisateurs → rôle Conseiller*) et assignez les étudiants.

## 6. Configuration métier (obligatoire avant ouverture)
- **/admin/reglages** : numéro Wave (bénéficiaire, numéro, lien officiel éventuel) et numéro WhatsApp. Tant qu'ils sont vides, l'étudiant voit « coordonnées non configurées » au moment de payer.
- **/admin/packs** : vérifier prix, services inclus et **non inclus**.
- **/admin/pays** : saisir procédures, budget, visa, logement, **uniquement à partir de sources officielles**, avec lien et date de vérification. Vides, les pages affichent « information en cours de vérification ».
- **/admin/faq** : relire.
- **Pages légales** (`/mentions-legales`, `/confidentialite`, `/cgu`) : ce sont des **gabarits** à faire rédiger/valider par un juriste (et vérifier les obligations de déclaration auprès de l'autorité sénégalaise de protection des données).
- **Données de démonstration** à retirer :
```sql
delete from programs where is_demo; delete from institutions where is_demo; delete from testimonials where is_demo;
```
- Supprimer tout compte de démonstration éventuel.

## 6 bis. Photos et application mobile
- **Photos** (facultatif) : déposez `public/images/hero/hero.jpg` et `public/images/pays/<pays>.jpg` (voir `public/images/README.md`), puis redéployez : elles remplacent automatiquement les illustrations. Libres de droits ou achetées uniquement.
- **Installation sur le téléphone** : le site est installable (Android/Chrome : « Installer l'application » ; iOS/Safari : Partager → « Sur l'écran d'accueil »). Il s'ouvre alors en plein écran, avec la barre d'onglets. Pas de mode hors ligne dans cette version.

## 7. Diagnostic
- `GET /api/health` → `{"status":"ok"}` (200) ou `degraded` (503).
- `GET /api/health?token=VOTRE_HEALTH_TOKEN` → détail booléen (variables présentes, base joignable), jamais de valeurs.
- Brancher cette URL sur une sonde de disponibilité (UptimeRobot, Better Stack…).

## 8. Exploitation
- **Sauvegardes** : activer les sauvegardes Supabase (selon votre plan) **et** tester une restauration.
- **Journaux** : Vercel → *Logs*. Chercher `[rate-limit]` (limitation indisponible = protection désactivée).
- **Mises à jour du schéma** : ajouter une migration `supabase/migrations/2026…_xxx.sql`, l'exécuter sur Supabase, puis `npm run sql:bundle` (ne sert que pour les nouvelles installations). Le test `bundle.test.ts` échoue si `setup.sql` est périmé.
- **Retour arrière** : Vercel → *Deployments → Promote/rollback*. Les migrations SQL ne se défont pas automatiquement.
- **Prix** : modifier un prix dans /admin/packs n'affecte pas les commandes déjà passées.

## 9. Limites connues de cette version
- Documents : **4 Mo maximum** par fichier (limite de 4,5 Mo par requête sur Vercel). Un scan plus lourd doit être compressé. Évolution possible : envoi direct vers Supabase Storage par URL signée.
- Pas d'e-mails transactionnels : les notifications sont internes à la plateforme ; la preuve de paiement et le contact passent par WhatsApp.
- Aucun paiement automatisé : Wave est manuel (preuve + validation humaine), par conception.
- La CSP autorise `'unsafe-inline'` pour les scripts ; à durcir avec des nonces ultérieurement.
- Blog et témoignages : tables prêtes, pas encore d'écran d'administration.
