import { generateLevel, validateGeometry, calculateDependencies, hasCycle, solveDependencies, rayCells, DIRS, canExit } from '../engine.js';

function strictlySolvable(level) {
  const { rows, cols } = level.grid;
  const key = (r,c)=>`${r},${c}`;
  const arrowsById = new Map(level.arrows.map(a=>[a.id,a]));
  const remaining = new Set(level.solution);
  for (const id of level.solution) {
    remaining.delete(id);
    const map = new Map();
    for (const rid of remaining) for (const p of arrowsById.get(rid).path) map.set(key(...p), rid);
    const a = arrowsById.get(id);
    const head = a.path[a.headIndex];
    for (const p of rayCells(head, a.direction, rows, cols)) {
      if (map.has(key(...p))) return { ok:false, reason:`flèche ${id} bloquée par ${map.get(key(...p))}` };
    }
  }
  return { ok:true };
}
function alignmentOk(level) {
  const problems = [];
  for (const a of level.arrows) {
    if (a.path.length < 2) continue;
    const head = a.path[a.headIndex];
    const next = a.path[a.headIndex === 0 ? 1 : a.path.length - 2];
    const [dr, dc] = DIRS[a.direction];
    if (next[0] !== head[0]-dr || next[1] !== head[1]-dc) problems.push(a.id);
  }
  return problems;
}

let ok = 0, total = 40;
const t0 = Date.now();
for (let seed = 1; seed <= total; seed++) {
  const level = generateLevel({ seed: seed*7919, fast: seed % 2 === 0 });
  const geo = validateGeometry(level);
  const strict = strictlySolvable(level);
  const align = alignmentOk(level);
  if (geo.valid && strict.ok && align.length === 0) ok++;
  else console.log(`seed ${seed} KO`, geo.errors, strict, align);
}
console.log(`${ok}/${total} valides. Temps: ${Date.now()-t0}ms`);

// Test de canExit() en simulant une partie complète
const level = generateLevel({ seed: 42, fast: true });
const remaining = new Set(level.arrows.map(a => a.id));
let played = 0;
for (const id of level.solution) {
  if (!canExit(level, id, remaining)) {
    console.log(`canExit() refuse ${id} alors que la solution dit qu'il devrait sortir maintenant !`);
    break;
  }
  remaining.delete(id);
  played++;
}
console.log(`Partie simulée via canExit(): ${played}/${level.arrows.length} coups joués avec succès.`);

// Test que canExit() refuse bien un coup prématuré (si possible d'en trouver un)
const level2 = generateLevel({ seed: 99, fast: true });
const remaining2 = new Set(level2.arrows.map(a => a.id));
let foundBlockedTest = false;
for (const a of level2.arrows) {
  if (a.id === level2.solution[0]) continue; // celle-ci doit pouvoir sortir
  if (!canExit(level2, a.id, remaining2)) { foundBlockedTest = true; break; }
}
console.log('canExit() détecte bien au moins un coup bloqué au départ ?', foundBlockedTest);
