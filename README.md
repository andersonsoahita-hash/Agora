# Agora — L’art oratoire · by Stephen

Application personnelle de coaching de prise de parole, installable (PWA) sur iPhone et Android.
Aucune donnée personnelle dans ce dépôt : l’appli démarre vide, tes données restent sur ton téléphone.

## Utiliser
Ouvre le lien GitHub Pages du dépôt dans Safari (iPhone) ou Chrome (Android), puis « Sur l’écran d’accueil » / « Installer ».

## Modifier
Les sources sont dans `src/`. Après modification : `node build.js` régénère `index.html`, `app.js`, `style.css`, `sw.js` (nouveau numéro de version automatique), puis commit + push. L’appli propose alors « Mettre à jour » dans Réglages.

## Tests
`node test/smoke.js` (serveur local sous `/Agora/` + Chromium Playwright).

## Coupe-circuit
`acces.json` : mettre `{"actif": false, "message": "…"}` suspend l’accès (les données restent sur le téléphone).
