import { generateLevel, validateGeometry, rayCells, DIRS } from '../engine.js';

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
function checkPathAdjacency(level) {
  // Vérifie aussi que la case fusionnée reste bien adjacente/connectée
  // (le chemin de la flèche entière doit rester une suite de cases voisines).
  const problems = [];
  for (const a of level.arrows) {
    for (let i = 1; i < a.path.length; i++) {
      const [pr, pc] = a.path[i-1];
      const [r, c] = a.path[i];
      if (Math.abs(r-pr) + Math.abs(c-pc) !== 1) problems.push(a.id);
    }
  }
  return problems;
}

let ok = 0, total = 60, singleCell = 0, totalArrows = 0;
const t0 = Date.now();
for (let seed = 1; seed <= total; seed++) {
  const level = generateLevel({ seed: seed * 13337 + 7, arrows: 60, fast: seed % 2 === 0 });
  const geo = validateGeometry(level);
  const strict = strictlySolvable(level);
  const align = alignmentOk(level);
  const adj = checkPathAdjacency(level);
  const singles = level.arrows.filter(a => a.path.length < 2).length;
  singleCell += singles;
  totalArrows += level.arrows.length;

  const good = geo.valid && strict.ok && align.length === 0 && adj.length === 0 && singles === 0;
  if (good) ok++;
  else console.log(`seed ${seed} KO`, { geoErrors: geo.errors, strict, align, adj, singles });
}
console.log(`\n${ok}/${total} niveaux 100% valides (solvabilité + alignement + adjacence + AUCUNE flèche <2 cases).`);
console.log(`Flèches à moins de 2 cases sur l'ensemble : ${singleCell} / ${totalArrows}`);
console.log(`Temps: ${Date.now()-t0}ms`);
