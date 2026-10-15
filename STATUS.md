# STATUS — v1.1.0 (refonte UX/UI + audit full-stack et sécurité)

## Verdict honnête
v1.1.0 = nouvelle interface (voir `AUDIT.md` §7). **Vérifiée dans un vrai Chromium** : 12 pages publiques sans débordement ni erreur de console/CSP aux largeurs 360 à 1280, interactions réelles (menu mobile, parcours du test d'orientation) validées. **Toujours jamais exécutée contre un vrai Supabase**, ni sur un téléphone réel, Safari ou Firefox.
v1.0.1 = v1.0.0 + audit complet (voir **`AUDIT.md`**) : 9 constats corrigés dont un défaut de sécurité élevé (un compte désactivé conservait l'accès aux données), accessibilité des couleurs verrouillée par test, 10 migrations.
Le code est complet pour le périmètre ci-dessous, vérifié automatiquement, et **déployable** (installation propre `npm ci` + build validés dans un dossier vierge).
**Il n'a jamais tourné contre un vrai projet Supabase ni dans un navigateur.** Le premier déploiement doit donc être suivi de la recette (`RECETTE.md`) avant toute ouverture au public. Des écarts sont probables et normaux à ce stade (voir « Risques »).

## Vérifié automatiquement (`npm run check`)
- lint · typecheck · **274 tests** · build de production · installation propre depuis le lockfile · `npm audit --omit=dev` : 0 vulnérabilité.
- ~130 tests s'exécutent sur un vrai PostgreSQL (PGlite) : migrations, RLS sur 100 % des tables, workflow de paiement (parité TS↔SQL), documents, rôles, projet, candidatures, contenu administrable, limitation anti-abus, traçabilité, SQL d'installation + seed.
- Serveur de production testé : pages publiques 200, routes privées redirigées vers /connexion, en-têtes de sécurité présents, `/api/health` (statut seul / détail avec jeton), refus propres de l'API documents sans configuration.

## Fonctionnalités livrées
Site public (accueil, pays, packs + comparateur, test d'orientation, FAQ, contact, légal en gabarits, SEO) · authentification · paiement en 2 étapes Wave manuel + preuve WhatsApp, validé par le staff · documents privés versionnés (URLs signées 60 s, revue, traçabilité des consultations) · projet historisé · candidatures avec historique et transitions imposées · rendez-vous · messagerie · notifications internes · progression réelle et prochaine étape · espaces étudiant / conseiller / admin · administration des packs, pays + procédures (liens officiels), FAQ, réglages, utilisateurs, journal d'audit · limitation anti-abus · en-têtes de sécurité.

## Adaptations pour Vercel (cette livraison)
- **Taille des documents plafonnée à 4 Mo** (Vercel refuse les requêtes > 4,5 Mo ; l'ancien plafond de 10 Mo aurait échoué silencieusement).
- `vercel.json` (région Paris `cdg1`), `engines`, `prebuild` qui **bloque un build de production mal configuré**, messages d'erreur de build actionnables, `/api/health`, `supabase/setup.sql` (installation en un fichier, synchronisation vérifiée par test), `.env.example` nettoyé (variables inutilisées retirées), résidus de génération supprimés, icône du site.

## Risques à connaître
1. **Supabase réel jamais testé** : Auth, Storage réel, PostgREST (`rpc`, embeds imbriqués), cache ISR avec vraies données, droits sur `storage.objects` au moment de l'exécution du SQL.
2. **CSP jamais essayée dans un navigateur** (`'unsafe-inline'` requis par Next.js) : vérifier la console ; si elle bloque l'hydratation, assouplir `src/lib/security/headers.ts`.
3. **Limitation anti-abus** testée côté SQL seulement ; « fail-open » si le service est indisponible (surveiller les logs `[rate-limit]`).
4. Formulaires d'administration et pages protégées jamais rendus avec de vraies données ni testés sur mobile.
5. **Provenance** : à deux reprises, l'arbre de travail contenait du code postérieur à mes archives, que je n'ai pas vu réaliser (migration 5 et pages de suivi ; corrections de la migration 9, flash signés, mot de passe oublié, notifications, profil). Relu et testé, mais à faire relire par un humain avant production.
6. Code des pages candidatures / rendez-vous / messagerie et migration 5 : d'origine non tracée dans mon historique visible ; testé (tests propres + relecture du SQL) mais moins relu que le reste. À faire relire avant production.
6. `npm audit` complet signale 5 alertes « high » dans `braces`, dépendance **transitive de l'outil de lint** (`eslint-config-next`), absente du build de production. Non corrigé : `npm audit fix --force` risque de casser la configuration ESLint.

## Hors périmètre / à faire
- E-mails transactionnels ; blog (CMS) et témoignages (tables prêtes, pas d'écran) ; page « formations » côté étudiant ; liste complète des notifications et paramètres ; demande de document par le conseiller ; assignation depuis la fiche dossier.
- Envoi direct des fichiers vers Supabase Storage (supprimerait la limite de 4 Mo) ; CSP à nonces ; limitation sur les autres actions ; antivirus sur les fichiers ; test de pénétration ; photos (le mockup en utilise, droits d'usage à fournir).
- **Contenu à fournir par vous** : numéros Wave/WhatsApp, procédures officielles par pays (avec sources), textes légaux validés par un juriste.
