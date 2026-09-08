# ArrowMaze

Un puzzle où chaque flèche doit sortir d'une grille 40×40 entièrement
couverte de flèches enchevêtrées. Une flèche ne peut sortir que si tout son
chemin de sortie, jusqu'au bord de la grille, est libre de toute autre
flèche encore présente.

Site pur HTML/JS, sans framework ni étape de build : ouvrir `index.html`
suffit (ou servir le dossier avec n'importe quel serveur statique).

## Fichiers

- **`index.html`** — le jeu. Touche une flèche pour tenter de la faire
  sortir ; "Nouveau niveau" en génère un autre à la volée.
- **`editor.html`** — l'éditeur/générateur : réglages (nombre de flèches,
  seed, longueurs), aperçu, export JSON.
- **`engine.js`** — le moteur partagé par les deux (module ES) : génération
  de niveaux et logique de sortie des flèches.

## Comment la solvabilité est garantie

Les versions précédentes du générateur construisaient un chemin
Hamiltonien, le découpaient en flèches, puis essayaient après coup de
choisir une direction de sortie pour chacune en espérant obtenir un graphe
de dépendances sans cycle. Sur une grille 40×40 couverte à 100 %, c'est
statistiquement presque impossible : quasiment toutes les configurations
générées ainsi contiennent un blocage circulaire caché.

Le moteur actuel construit les flèches **directement dans leur ordre de
sortie** ("construction en oignon") : une case ne peut devenir tête d'une
nouvelle flèche, dans une direction donnée, que si tout son rayon de sortie
est déjà occupé par des flèches précédemment construites (ou sort
immédiatement de la grille). Le premier pas du corps est en plus forcé dans
la direction opposée à la sortie, pour que le dernier segment du tracé soit
toujours aligné avec la pointe de la flèche.

Résultat : un niveau généré est solvable **par construction**, jamais
vérifié après coup. Testé sur plusieurs centaines de générations et parties
jouées avec des ordres de coups choisis librement (pas seulement la
solution officielle).
