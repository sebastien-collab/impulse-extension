# Impulse — Chrome Extension

## Description
Debugger universel de pixels et tags de tracking pour media buyers.
Détecte en temps réel les pixels présents sur n'importe quelle page web.

## Plateformes supportées (10)
GTM, GA4, Google Ads, Meta Pixel, TikTok, LinkedIn, Pinterest, Snapchat, Twitter/X, Microsoft UET/Bing

## Architecture

### Manifest V3 — Fichiers clés
- `manifest.json` — Configuration de l'extension (permissions, content scripts, service worker)
- `shared/pixels.js` — Définitions centralisées des 10 plateformes (globals, patterns, couleurs)
- `content/injected.js` — Intercepteur MAIN world (traps sur les variables globales JS)
- `content/content.js` — Content script ISOLATED world (bridge postMessage + scan DOM)
- `background/service-worker.js` — Gestion d'état par onglet, monitoring réseau (webRequest), badge
- `popup/popup.html` + `popup.css` + `popup.js` — Interface utilisateur (thème sombre)
- `icons/` — Icônes 16/48/128px

### Triple détection
1. **Interception JS (MAIN world)** — `Object.defineProperty` sur les globales (`fbq`, `gtag`, `ttq`...) + intercept des appels de fonctions
2. **Scan DOM (ISOLATED world)** — Extraction des IDs depuis les balises `<script>` et `<noscript>`
3. **Monitoring réseau** — `chrome.webRequest.onBeforeRequest` sur les domaines de tracking

### Flux de données
`injected.js` (MAIN) → `postMessage` → `content.js` (ISOLATED) → `chrome.runtime.sendMessage` → `service-worker.js` → `chrome.storage.session`

## Stack technique
- JavaScript vanilla (pas de framework, pas de bundler)
- Chrome Extensions Manifest V3
- `chrome.storage.session` pour la persistance par onglet

## Design
- Thème sombre : fond `#0F1117`
- Accent violet/indigo : `#6366F1`
- Popup : 400×600px
- Coloration syntaxique JSON pour les payloads d'événements
