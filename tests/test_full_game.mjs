import { generateLevel, canExit, validateGeometry } from '../engine.js';

// Simule 10 parties complètes "à l'aveugle" : à chaque tour, on cherche
// N'IMPORTE QUELLE flèche jouable (pas forcément celle de la solution
// officielle), comme le ferait un vrai joueur qui explore. Le jeu doit
// rester gagnable jusqu'au bout quel que soit l'ordre choisi PARMI les
// coups valides à chaque instant (c'est la définition même de la
// solvabilité garantie par le graphe de dépendances acyclique).
function playRandomly(level, rngSeed) {
  let s = rngSeed;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const remaining = new Set(level.arrows.map(a => a.id));
  let guard = 0;
  while (remaining.size > 0) {
    guard++;
    if (guard > level.arrows.length * 50) return { stuck: true, remaining: remaining.size };
    const playable = [...remaining].filter(id => canExit(level, id, remaining));
    if (!playable.length) return { stuck: true, remaining: remaining.size };
    const pick = playable[Math.floor(rand() * playable.length)];
    remaining.delete(pick);
  }
  return { stuck: false };
}

let allOk = true;
for (let seed = 1; seed <= 10; seed++) {
  const level = generateLevel({ seed: seed * 12345, arrows: 60, fast: true });
  const geo = validateGeometry(level);
  const result = playRandomly(level, seed * 999 + 1);
  const ok = geo.valid && !result.stuck;
  if (!ok) { allOk = false; console.log(`seed ${seed}: ÉCHEC`, geo.errors, result); }
}
console.log(allOk ? '✓ 10/10 parties jouées jusqu\'au bout avec des coups choisis librement (pas seulement la solution officielle).' : '✗ Problème détecté.');
