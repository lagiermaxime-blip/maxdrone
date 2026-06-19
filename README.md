# Max Drone — site vitrine

Site vitrine immersif pour le drone (fictif) **Max Drone**. Le cœur du site est une
vidéo *Earth Zoom Out* dont la lecture est **pilotée par le scroll** : plus on
descend, plus le drone s'élève — du sol jusqu'à l'espace.

## Structure

```
index.html      Structure : nav (Concept · Contact) + Hero + Concept + Contact
styles.css      Thème spatial sombre, sticky, responsive
script.js       Scroll → video.currentTime + apparition des textes + formulaire
assets/
  max-drone.mp4 La vidéo Earth Zoom Out
```

## Comment ça marche (scroll → vidéo)

- La section `#concept` mesure `500vh` ; la vidéo est en `position: sticky`, plein écran.
- `script.js` calcule la progression du scroll dans cette section (0 → 1).
- Cette progression est mappée sur la durée de la vidéo : `currentTime = progress × duration`.
- Un lissage (lerp en `requestAnimationFrame`) rend le défilement fluide.
- Les 6 textes apparaissent par paliers ; une barre « Sol → Espace » suit l'ascension.

## Lancer en local

⚠️ Le scrub vidéo a besoin des **requêtes HTTP Range** (lecture par plages d'octets).
Le module `python -m http.server` **ne les gère pas** : la vidéo resterait figée.

Utilisez un serveur qui les supporte, par exemple :

```bash
npx serve .          # gère les Range requests
# ou
php -S localhost:8000
```

Puis ouvrez l'URL indiquée.

## Déploiement

N'importe quel hébergeur de fichiers statiques convient (Netlify, Vercel, GitHub
Pages, Cloudflare Pages, S3…) — tous gèrent les requêtes Range nativement.
Déposez simplement `index.html`, `styles.css`, `script.js` et le dossier `assets/`.

## Personnalisation rapide

- **Textes de l'ascension** : éditez les `<article class="step">` dans `index.html`.
- **Couleurs / thème** : variables CSS en haut de `styles.css` (`:root`).
- **Douceur du scrub** : facteur `0.12` dans `rafLoop()` (`script.js`) — plus haut = plus réactif.
- **Hauteur de défilement** : `.concept { height: 500vh }` dans `styles.css`.

## Accessibilité & performance

- `prefers-reduced-motion` : le scrub est désactivé, les textes s'empilent et la vidéo
  joue en boucle douce.
- Repli textuel si la vidéo ne charge pas, écran de chargement pendant la mise en mémoire.
- Vidéo `muted`, `playsinline`, `preload="auto"`, sans autoplay intempestif.
