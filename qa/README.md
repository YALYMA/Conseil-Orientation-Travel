# Contrôles navigateur

Outils utilisés pour valider le design : ils pilotent un vrai Chromium (embarqué dans `@sparticuz/chromium`, aucun téléchargement externe).

```bash
cd qa && npm install
# dans un autre terminal, à la racine : npm run build && npm start   (ou une URL de préproduction)
AWS_EXECUTION_ENV=AWS_Lambda_nodejs22.x node shoot.mjs http://localhost:3000 maquette "/,/packs,/pays/france" 360,390,768,1280
AWS_EXECUTION_ENV=AWS_Lambda_nodejs22.x node interact.mjs http://localhost:3000
```
- `shoot.mjs` : une ligne par page et par largeur (`✓` si rien à signaler), captures dans `qa/qa-out/`. Variable `SMALL=1` : détail des cibles tactiles trop petites.
- `interact.mjs` : clique réellement (menu mobile, parcours complet du test d'orientation, bannière défilante : défilement, pause, reprise, format des prix) et échoue si la console contient une erreur ou une violation de la CSP.
- Sur macOS / Windows, `AWS_EXECUTION_ENV` est inutile ; vous pouvez aussi remplacer `executablePath` par votre Chrome local.
- Les pages connectées (`/app`, `/advisor`, `/admin`) exigent une session Supabase : non couvertes ici.
