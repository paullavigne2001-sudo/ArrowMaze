# ArrowMaze

## Générateur V8.1

`public/ArrowMaze_V8.1.html` est le générateur autonome V8.1. Il construit 60 flèches sur une grille 40×40, calcule toutes les dépendances présentes sur chaque rayon de sortie, rejette les cycles et optimise la difficulté à partir de la profondeur logique, des choix disponibles et des dépendances. Le nombre de virages sert uniquement de contrôle géométrique.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
