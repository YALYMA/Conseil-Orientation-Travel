# Rapport d'audit — Conseil-Orientation-Travel v1.1.0

Audit full-stack et sécurité du dépôt livré en v1.0.0, avec corrections. Les constats sont classés par gravité ; chaque correction est
couverte par un test automatique, sauf mention contraire.

## 1. Méthode
Mesures objectives d'abord, relecture ensuite : inventaire des routes et des liens (code **et** SQL), politiques RLS d'écriture et droits
d'exécution des fonctions extraits d'une vraie base PostgreSQL, scan des secrets dans le JavaScript client, calcul des contrastes WCAG,
code mort (`tsc --noUnusedLocals`, `depcheck`), puis relecture manuelle des actions serveur, routes API, migrations et modules de sécurité.
Vérification finale sur le serveur de production (routes, redirections, en-têtes, usurpation de message).

## 2. Constats corrigés dans cette passe

| # | Gravité | Constat | Correction |
|---|---|---|---|
| S1 | **Élevée** | **Un compte désactivé gardait l'accès aux données.** `is_active` n'était contrôlé qu'à la connexion ; `can_access_student()` l'ignorait. Un conseiller désactivé conservait la lecture des documents, paiements et messages de ses étudiants et les liens signés de leurs pièces d'identité tant que son jeton restait valide. | `can_access_student()` et la politique de lecture du stockage exigent un profil actif ; `getSessionProfile()` traite un compte inactif comme déconnecté. Tests `deactivation.test.ts` (conseiller, étudiant, admin, réactivation). |
| S2 | Moyenne | Un administrateur pouvait changer un rôle par mise à jour directe **sans aucune trace d'audit** (seul `admin_set_role` journalisait) ; les changements faits en SQL (premier admin) non plus. | Déclencheur d'audit sur `profiles` (rôle et activation), quel que soit le chemin ; `admin_set_role` ne double plus la ligne. Tests `role-audit.test.ts`. |
| S3 | Faible | Signature des messages flash **malléable** : un caractère ajouté à la fin restait accepté (le décodage base64url ignore les bits en trop). Le contenu n'était pas falsifiable, mais un jeton doit avoir une seule forme valide. | Comparaison en forme canonique. Tests `flash-canonical.test.ts`. |
| S4 | Faible | Après un changement de mot de passe, **les autres sessions restaient ouvertes**. | `signOut({ scope: "others" })` après la mise à jour. |
| A1 | Moyenne | **Accessibilité des couleurs** : 72 occurrences de texte secondaire sous le seuil WCAG AA (`text-navy/55…/70`, 3,2 à 4,5:1) ; vert `#16A36A` en texte/fond de bouton (3,24:1) ; rouge d'erreur (4,38:1) ; placeholders à 2,2:1. | Texte secondaire à 75 % (5,5:1), vert « encre » `#0D7A50` pour le texte et les boutons (le vert d'origine reste pour les glyphes décoratifs), rouge `#C23131` (5,56:1), placeholders à 70 %. **Test `contrast.test.ts`** : lit les vrais tokens et interdit les classes à faible contraste dans le code. |
| R1 | Faible | En-tête mobile : logo de 26 caractères + bouton « Menu » trop justes à 360 px (retour à la ligne probable). | Logo compact sous 400 px, bouton resserré. **Non vérifié visuellement** (voir §5). |
| U1 | Faible | Lien de confirmation d'e-mail ouvert sur un autre appareil : le message « lien plus valide » était trompeur (l'e-mail est confirmé). | Message explicite invitant à se connecter. |
| U2 | Faible | Lien invisible dupliqué dans chaque carte de pack (bruit pour les lecteurs d'écran). | Supprimé. |
| SEO | Faible | Pages de connexion/inscription indexables. | `noindex`. |

## 3. Éléments déjà corrigés dans le dépôt au début de l'audit (relus et vérifiés)
Au début de l'audit, l'arbre de travail contenait des corrections postérieures à l'archive v1.0.0, **que je n'avais pas vues réalisées**.
Je ne les ai pas tenues pour acquises : relues ligne à ligne et vérifiées par les tests (251) et par un test réel sur serveur de production.
- **Usurpation de contenu par URL** : un lien `/page?erreur=Appelez le 77…` affichait un message arbitraire. Les retours d'action sont désormais **signés (HMAC, expiration 5 min)** et appliqués partout (0 redirection manuelle, 15 pages via `<Flash>`). Vérifié en réel : le faux message n'est **jamais affiché**.
- **CSRF** de la route d'upload : contrôle d'origine ; rôle vérifié avant tout dépôt ; dépôt et suppression par le serveur uniquement (un étudiant ne peut plus contourner la validation ni effacer le fichier d'un document déjà validé).
- Migration 9 : suppression des écritures directes (stockage, réglages, notifications, profils, suppression de document), contraintes de format, droits d'exécution resserrés, `search_path` durci.
- Omissions comblées : pages 404 / erreur / chargement (sans message technique), mot de passe oublié et réinitialisation, notifications, callback d'authentification.
- **Rectification (v1.1.0)** : la v1.0.1 annonçait aussi la page « Mon profil » comme comblée. **C'était inexact** : le dossier existait mais était vide (aucune page), et la fonction SQL `update_my_profile` n'avait aucune interface. J'avais pris la présence du dossier et de la fonction pour celle de la page. La page est construite en v1.1.0, et un test échoue désormais s'il existe un dossier vide ou un lien vers une route absente.

## 4. Vérifié sans anomalie
Aucun secret dans le JavaScript client · 0 lien interne orphelin (code et SQL) · chaque page a un seul `<h1>` · tous les liens externes ont `rel="noopener"` · liens de visioconférence forcés en https · pas de SQL construit par concaténation · SQL dynamique limité aux boucles de migration sur identifiants du catalogue · aucune page d'erreur n'affiche de message technique · redirections `next` restreintes aux chemins internes · réponse identique que le compte existe ou non (réinitialisation) · `npm audit --omit=dev` : 0 vulnérabilité · pas de code mort ni de dépendance inutile.

## 5. Limites de cet audit (à lire)
- **(Mis à jour en v1.1.0)** Un vrai Chromium est désormais utilisé : responsivité mesurée et CSP testée (voir §7). Limites restantes : **Chromium uniquement** (ni Safari/iOS, ni Firefox), émulation de téléphone (pas d'appareil réel), et **espaces conseiller/administrateur non photographiés avec de vraies données** (ils exigent une session Supabase).
- **Supabase réel jamais utilisé** : Auth, Storage, PostgREST et ISR avec vraies données non testés ; la base est testée sur PostgreSQL local (PGlite).
- Ce n'est **pas un test d'intrusion** : pas d'attaque active, pas de fuzzing, pas de revue de l'infrastructure Vercel/Supabase.
- Un de mes propres tests m'a d'abord fait croire à une fuite de message : il comptait aussi le texte des scripts. L'analyse du HTML a montré que le faux texte n'apparaît que dans les données techniques de Next.js (clé de route), **jamais dans le texte visible**.

## 6. Risques résiduels (non corrigés)
1. **Inscription directe via l'API Supabase** (clé publique) : elle contourne notre limitation de débit (le trigger assainit les données, mais la protection anti-abus relève alors de Supabase : à régler dans *Auth → Rate limits*, activer un captcha si besoin).
2. Changement de mot de passe **sans ré-authentification** (le jeton de session suffit).
3. Tables éditoriales sans interface (blog, établissements, formations, témoignages) : écriture directe par un administrateur, **non auditée**.
4. Le numéro Wave et le numéro WhatsApp sont **publics par conception** (`site_settings.is_public`) : lisibles via l'API sans compte.
5. CSP avec `'unsafe-inline'` (scripts) ; limitation de débit « fail-open » ; pas d'antivirus sur les fichiers ; documents limités à 4 Mo ; pas d'e-mails transactionnels.
6. 5 alertes `npm audit` (« high ») dans `braces`, dépendance **transitive de l'outil de lint**, absente du build de production.
7. Pas de messagerie globale côté conseiller (la conversation est dans la fiche de chaque étudiant).

## 7. Refonte UX/UI (v1.1.0) : ce que les tests en navigateur réel ont révélé
Ces défauts n'étaient visibles qu'avec un vrai navigateur ; chacun est corrigé et, quand c'était possible, verrouillé par un test.

| Défaut constaté | Cause | Correction / garde-fou |
|---|---|---|
| Drapeaux emoji invisibles (carrés vides) | Windows n'affiche pas les emoji-drapeaux | Drapeaux SVG (`Flag`) ; test : chaque pays a un drapeau |
| Menu mobile inutilisable (panneau de 32 px) ; fond sombre du menu « Plus » limité à la barre | `backdrop-blur` sur un ancêtre = bloc de référence des éléments `fixed` | Flou retiré ; test navigateur : hauteur du panneau, fond plein écran, clic extérieur |
| Page de 649 px de large sur un écran de 360 px | Textes `sr-only` (position absolue) échappant au tableau à défilement non positionné | `relative` sur tous les conteneurs `overflow-x-auto` ; **test de régression** |
| Débordement de 10 px sur l'accueil à 360 px | Décor `absolute -inset-10` | Rognage `overflow-x-clip` de la section |
| Logo sur deux lignes, chevauchant la navigation | Balise `<wbr>` (ignore `nowrap`) puis logo non réservé | `<wbr>` retirée, place réservée, liens secondaires masqués selon la largeur ; mesure à 9 largeurs |
| Haut des cartes rogné sous la bannière | Vague en `absolute` peinte au-dessus des blocs non positionnés | `relative z-10` sur les blocs qui la chevauchent |
| Mot « Candidatures » débordant de sa tuile (360 px) | Icône et texte côte à côte | Disposition verticale sur petit écran |
| Cibles tactiles de 17 à 36 px | Liens de navigation, pied de page, FAQ, fil d'Ariane | 44 px minimum (liens dans une phrase exemptés, WCAG 2.5.8) |
| Quatre cartes identiques « en cours de vérification » sur les pays | Une carte par rubrique vide | Une seule carte tant que rien n'est publié |

**Rectification de méthode** : mes mesures initiales concluaient à « aucun débordement à 360/390 px ». Elles étaient **fausses** : mon outil comparait la page à `innerWidth`, or Chrome élargit silencieusement cette valeur en cas de débordement. L'outil compare désormais à la largeur d'écran voulue, et c'est ce qui a révélé les défauts ci-dessus.

**Vérifié dans Chromium** : 12 pages publiques × 3 à 4 largeurs (360, 390, 768, 1280) sans débordement, sans erreur de console ni violation de CSP, sans image cassée ; menu mobile, parcours complet du test d'orientation, remplacement par une photo (testé avec de vraies images puis retiré), manifeste et icônes d'application.
