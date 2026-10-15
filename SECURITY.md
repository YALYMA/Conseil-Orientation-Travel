# Sécurité

## Mesures en place (vérifiées par tests)
- **RBAC + RLS** sur 100 % des tables. Étudiant = ses lignes ; conseiller = étudiants assignés ; admin = tout.
- **Pas d'élévation de privilège** : le rôle est forcé à « student » à l'inscription (trigger) ; modification réservée à `admin_set_role` (un admin ne peut pas modifier son propre rôle).
- **Paiements** : prix lu en base, 50/50 calculé en SQL, contrainte `CHECK`. Une preuve ne valide jamais un paiement. Transitions imposées en base, motif obligatoire pour rejet/annulation.
- **Documents** : bucket privé, chemin `{user_id}/…` imposé par le serveur et par la politique de stockage, contrôle MIME + extension + taille + signature binaire, URL signée de 60 s après vérification RLS, aucun document validé remplaçable.
- **Audit** : paiements, documents, rôles, assignations, réglages. Métadonnées minimales (pas de noms de fichiers, pas de valeurs de réglages).
- **Auth** : validation Zod côté serveur, message d'échec générique, redirections internes uniquement, session rafraîchie par le proxy.
- `SUPABASE_SERVICE_ROLE_KEY` n'est lue que dans `lib/supabase/admin.ts` (`server-only`) et n'est actuellement utilisée par aucune route.

- **Limitation anti-abus** : connexion (20 / 10 min par IP, 5 / 10 min par e-mail), inscription (5 / h par IP), dépôt de documents (30 / h par utilisateur). Compteurs en base (`rate_limit_hit`, fonction réservée au rôle `service_role`, appelée depuis le serveur) ; IP et e-mails stockés sous forme d'empreinte SHA-256 salée (`RATE_LIMIT_SALT`).
- **Traçabilité des documents** : toute consultation d'un document par le personnel (conseiller, admin) est journalisée avant la remise du lien signé ; si la journalisation échoue, aucun lien n'est délivré. La consultation par le propriétaire n'est pas journalisée.
- **En-têtes** : CSP (frame-ancestors 'none', object-src 'none', pas de joker, connexions limitées à soi-même et à Supabase), HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy. La CSP est calculée au build : `NEXT_PUBLIC_SUPABASE_URL` doit être défini à ce moment-là.

- **Comptes désactivés** : accès aux données retiré immédiatement (base et session), pas seulement à la prochaine connexion.
- **Audit des rôles** : tout changement de rôle ou d'activation est journalisé, y compris en SQL direct.
- **Retours d'action signés** (HMAC, 5 min) : aucun texte libre de l'URL n'est affiché (anti-usurpation de contenu).
- **Route d'upload** : contrôle d'origine, rôle vérifié, dépôt par le serveur uniquement ; les clients n'écrivent plus ni ne suppriment dans le stockage.
- **Réinitialisation de mot de passe** : réponse identique que le compte existe ou non, limitation de débit, fermeture des autres sessions.
- **Accessibilité** : contrastes WCAG AA verrouillés par test.

Rapport complet et risques résiduels : voir `AUDIT.md`.

## À faire / limites connues avant ouverture au public
- Tout a été testé sur PostgreSQL local (PGlite), **pas encore sur un vrai projet Supabase** (Auth, Storage réel, PostgREST).
- **CSP testée dans Chromium** (v1.1.0) : hydratation, menus, test d'orientation et images fonctionnent, console vierge. Non testée sous Safari/Firefox. Elle autorise `'unsafe-inline'` pour les scripts (nécessaire à Next.js sans nonce) : protection XSS affaiblie ; une CSP à nonce demande un rendu dynamique de toutes les pages.
- **Limitation « fail-open »** : si le service de limitation est indisponible (clé de service absente, base injoignable), la requête est autorisée et l'erreur journalisée. Surveiller les logs `[rate-limit]`. `SUPABASE_SERVICE_ROLE_KEY` est donc désormais utilisée par le serveur (uniquement pour cet appel).
- L'IP vient de `X-Forwarded-For` : fiable derrière Vercel, falsifiable derrière un proxy qui relaie l'en-tête du client ; la limite par e-mail reste la protection principale. Un attaquant qui varie les e-mails n'est freiné que par la limite par IP.
- La limitation n'est pas appliquée aux autres actions (déclaration de preuve, messages, rendez-vous, candidatures).
- Confirmation d'e-mail et politique de mot de passe : à régler dans Supabase Auth (activer la confirmation, protection contre les mots de passe compromis).
- Pas d'antivirus sur les fichiers déposés.
- Textes légaux = gabarits à faire valider ; déclaration des traitements de données personnelles (autorité sénégalaise de protection des données) à vérifier avec un juriste.
- Aucun test de pénétration réalisé.
