# Recette avant ouverture au public

À dérouler sur l'URL de production (ou de préproduction) après le déploiement. Cochez chaque ligne ; un seul ✗ bloquant = ne pas ouvrir.
Préparez 5 comptes **fictifs** : Étudiant A, Étudiant B, Conseiller 1, Conseiller 2, Admin (e-mails que vous contrôlez).

## A. Installation
- [ ] `/api/health?token=…` répond `ok` (variables présentes, base joignable).
- [ ] `/`, `/packs`, `/pays/france`, `/faq`, `/sitemap.xml`, `/robots.txt` répondent 200 ; une URL inventée donne une page 404.
- [ ] Console du navigateur (F12) **sans erreur « Content-Security-Policy »** sur l'accueil, `/orientation` et `/connexion`. Le menu mobile et les formulaires fonctionnent.
- [ ] Prix affichés = 20 000 / 40 000 / 75 000 / 120 000 FCFA avec moitié/moitié (ex. 75 000 → 37 500 + 37 500).
- [ ] Aucune page publique ne promet admission ou visa.

## B. Comptes et rôles
- [ ] Inscription Étudiant A → e-mail de confirmation reçu → connexion → `/app/dashboard`.
- [ ] Promotion Admin par SQL (voir `DEPLOYMENT.md` §5) → `/admin` accessible.
- [ ] Admin : crée Conseiller 1 et 2 (rôle), assigne A → Conseiller 1 et B → Conseiller 2.
- [ ] Étudiant A ouvre `/admin`, `/advisor/dashboard` → redirigé, jamais affiché.
- [ ] Déconnecté : `/app/dashboard` → redirigé vers `/connexion`.

## C. Réglages
- [ ] Admin → Réglages : numéro Wave et WhatsApp enregistrés ; un numéro invalide (`abc`) est refusé ; un lien `http://` est refusé.
- [ ] `/contact` affiche le bouton WhatsApp et ouvre un message prérempli.

## D. Paiement en deux étapes (Étudiant A, pack Candidature 75 000)
- [ ] Commander le pack : premier paiement **37 500**, solde **37 500**, statut « Premier paiement à effectuer ».
- [ ] Le bouton WhatsApp ouvre un message avec nom, pack, montant ; le numéro Wave affiché est le bon.
- [ ] « J'ai envoyé ma preuve » → statut « Preuve envoyée ». **Le paiement n'est PAS validé.**
- [ ] Conseiller 1 : voit la preuve → « Mettre en vérification » → « Rejeter » **sans motif refusé** → rejet avec motif → l'étudiant voit le motif.
- [ ] Rouvrir, nouvelle preuve, valider → « Accompagnement activé » ; l'étudiant reçoit une notification.
- [ ] Conseiller 2 **ne voit pas** la commande de A.
- [ ] Conseiller 1 : « Démarrer », puis « Prestations finalisées : demander le solde » → A voit « Solde à régler » (37 500) ; avant cette étape, A ne pouvait pas déclarer de preuve du solde.
- [ ] A déclare la preuve du solde → Conseiller 1 valide → « Accompagnement terminé ».
- [ ] Admin → Journal d'audit : chaque étape est listée, sans montants sensibles ni noms de fichiers.

## E. Documents (sécurité)
- [ ] A dépose un PDF (≤ 4 Mo) : statut « Téléversé » ; Conseiller 1 est notifié.
- [ ] Fichier `.exe` renommé en `.pdf` : **refusé**. Fichier > 4 Mo : message clair.
- [ ] Conseiller 1 : demande une correction **sans motif refusé**, puis avec motif → A voit le commentaire, dépose une v2.
- [ ] Valider : le document validé ne peut plus être remplacé.
- [ ] **Étudiant B colle l'URL `/api/documents/<id du document de A>/download`** → 404, jamais le fichier.
- [ ] Conseiller 2 idem → 404. Conseiller 1 → le fichier s'ouvre ; Journal d'audit : ligne `document.accessed`.
- [ ] Le lien signé expire (réessayer l'URL Supabase obtenue après ~2 minutes → refusé).

## F. Anti-abus
- [ ] 6 connexions ratées avec le même e-mail en 10 minutes → message « Trop de tentatives ». (Si ce n'est pas le cas : voir les logs `[rate-limit]` et `SUPABASE_SERVICE_ROLE_KEY`.)

## G. Suivi
- [ ] A renseigne « Mon projet » ; Conseiller 1 le modifie : l'audit liste les **champs** modifiés (pas leurs valeurs).
- [ ] Conseiller 1 crée une candidature, la fait passer À préparer → Prêt à déposer → Déposé ; un saut interdit (À préparer → Déposé) est refusé. A voit l'historique.
- [ ] Rendez-vous créé, confirmé ; messages échangés des deux côtés ; B ne voit rien de A.
- [ ] Le tableau de bord de A affiche progression et « Prochaine étape » cohérentes.

## H. Mobile et accessibilité
- [ ] Largeurs 360 et 390 px : accueil, packs, test d'orientation, connexion, tableau de bord, paiements : pas de défilement horizontal parasite, boutons ≥ 44 px, texte lisible.
- [ ] Navigation clavier (Tab) : focus visible, menu utilisable.

## I. Avant ouverture
- [ ] Pages légales validées par un juriste ; procédures pays saisies avec sources officielles ; FAQ relue.
- [ ] Données et comptes de démonstration supprimés ; sauvegardes Supabase activées ; sonde `/api/health` branchée.

## J. Ajouts de l'audit v1.0.1
- [ ] **Compte désactivé** : Admin désactive Conseiller 1 (SQL : `update profiles set is_active=false where …`) → Conseiller 1, session ouverte, rechargé : **plus aucun dossier ni document visible**, redirigé vers `/connexion`. Réactiver → l'accès revient.
- [ ] **Usurpation** : ouvrir `/connexion?erreur=Appelez le 77 000 00 00` → **aucun** message affiché.
- [ ] **Mot de passe oublié** : `/mot-de-passe/oublie` → e-mail reçu → nouveau mot de passe → les autres appareils sont déconnectés. Un e-mail inconnu affiche **la même réponse** qu'un e-mail connu.
- [ ] **Confirmation d'e-mail sur un autre appareil** : le message invite à se connecter (l'e-mail est bien confirmé).
- [ ] **Notifications** (`/app/notifications`) et **Profil** (`/app/profil`) : lecture, « tout marquer comme lu », modification du nom/téléphone (un numéro invalide est refusé).
- [ ] Pages **404** et d'erreur en français, sans message technique.
- [ ] **Contrastes** : le texte secondaire reste lisible sur fond blanc et sur fond bleu clair (zoom 100 %, écran de téléphone en plein soleil).
- [ ] **360 px** : l'en-tête (logo + bouton Menu) ne déborde pas ni ne se superpose.
- [ ] Journal d'audit : un changement de rôle direct en SQL apparaît (`user.role_changed`, acteur vide).

## K. Design et mobile (v1.1.0)
- [ ] **Téléphone réel** (Android et, si possible, iPhone) : accueil, packs, pays, test d'orientation, connexion. Aucun défilement horizontal de la page ; les cartes de pays et de packs se **balaient** au doigt.
- [ ] Barre d'onglets du bas : l'onglet de la page courante est coloré ; le bouton central « Test » ouvre le test. Dans l'espace connecté : « Plus » s'ouvre, toucher à côté le ferme.
- [ ] Menu de l'en-tête (☰) : panneau plein écran, se ferme après un clic sur un lien.
- [ ] **Drapeaux** visibles sur un PC Windows (pas de lettres « FR »).
- [ ] **Installation** sur l'écran d'accueil : icône correcte, ouverture plein écran, barre d'état bleu marine, aucune zone masquée par l'encoche ou la barre du bas.
- [ ] Safari (Mac/iPhone) et Firefox : mêmes contrôles que Chrome (non testés par nous). Console du navigateur sans erreur `Content-Security-Policy`.
- [ ] **Photos** (si vous en ajoutez) : bien cadrées sur mobile et ordinateur, titre lisible par-dessus.
- [ ] Pages connectées avec de vraies données : tableau de bord étudiant (anneau, prochaine étape, parcours), cartes de paiement, fiches conseiller et administration (non photographiées par nous).
- [ ] **Mon profil** (`/app/profil`) : modifier nom et téléphone ; un numéro invalide est refusé.
