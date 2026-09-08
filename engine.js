// ArrowMaze — engine.js
// Moteur partagé par l'éditeur (editor.html) et le jeu (index.html).
//
// Règle du jeu : une flèche ne peut sortir de la grille que si TOUT son
// rayon de sortie (de sa tête jusqu'au bord de la grille) est libre de
// toute autre flèche encore présente. La construction "en oignon" ci-dessous
// garantit qu'un niveau généré est TOUJOURS solvable : les flèches sont
// construites directement dans leur ordre de sortie plutôt que d'être
// vérifiées après coup.

export const DIRS = Object.freeze({
  up: [-1, 0],
  right: [0, 1],
  down: [1, 0],
  left: [0, -1]
});

export const DIR_NAMES = Object.freeze(Object.keys(DIRS));

export function opposite(dir) {
  return { up: 'down', down: 'up', left: 'right', right: 'left' }[dir];
}

export function inBounds(r, c, rows, cols) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

export function key(r, c) {
  return `${r},${c}`;
}

// Petit RNG déterministe (mulberry32) : reproductible à partir d'une seed.
export function makeRng(seed) {
  let s = (Number(seed) >>> 0) || 1;
  function next() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  next.int = (a, b) => Math.floor(next() * (b - a + 1)) + a;
  next.pick = (arr) => arr[next.int(0, arr.length - 1)];
  next.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = next.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return next;
}

// Liste des cases traversées par le rayon de sortie d'une flèche, de sa
// tête (exclue) jusqu'au bord de la grille (exclu).
export function rayCells(head, direction, rows, cols) {
  const [dr, dc] = DIRS[direction];
  const cells = [];
  let r = head[0] + dr, c = head[1] + dc;
  while (inBounds(r, c, rows, cols)) {
    cells.push([r, c]);
    r += dr; c += dc;
  }
  return cells;
}

export function cellToArrowMap(arrows) {
  const map = new Map();
  for (const a of arrows) for (const p of a.path) map.set(key(...p), a.id);
  return map;
}

// Dépendances complètes : une flèche dépend de TOUTES les flèches présentes
// sur son rayon de sortie (pas seulement la première rencontrée — c'est
// précisément le bug corrigé lors du passage de V6.x à V7.0).
export function calculateDependencies(arrows, rows, cols) {
  const map = cellToArrowMap(arrows);
  const deps = new Map(arrows.map(a => [a.id, new Set()]));
  for (const a of arrows) {
    if (a.headIndex == null || !a.direction) continue;
    const head = a.path[a.headIndex];
    for (const p of rayCells(head, a.direction, rows, cols)) {
      const other = map.get(key(...p));
      if (other != null && other !== a.id) deps.get(a.id).add(other);
    }
  }
  return deps;
}

export function hasCycle(deps) {
  const state = new Map();
  function dfs(v) {
    if (state.get(v) === 1) return true;
    if (state.get(v) === 2) return false;
    state.set(v, 1);
    for (const w of deps.get(v)) if (dfs(w)) return true;
    state.set(v, 2);
    return false;
  }
  for (const id of deps.keys()) if (dfs(id)) return true;
  return false;
}

export function solveDependencies(deps) {
  const remaining = new Set(deps.keys());
  const solution = [];
  while (remaining.size) {
    const available = [...remaining].filter(id =>
      [...deps.get(id)].every(d => !remaining.has(d))
    );
    if (!available.length) return null;
    available.sort((a, b) => a - b);
    solution.push(available[0]);
    remaining.delete(available[0]);
  }
  return solution;
}

// Vérifie si une flèche donnée peut sortir MAINTENANT, compte tenu des
// flèches encore présentes sur le plateau (`remainingIds`). C'est la
// fonction utilisée par le jeu à chaque clic du joueur.
export function canExit(level, arrowId, remainingIds) {
  const { rows, cols } = level.grid;
  const arrow = level.arrows.find(a => a.id === arrowId);
  if (!arrow) return false;
  const map = new Map();
  for (const id of remainingIds) {
    if (id === arrowId) continue;
    const a = level.arrows.find(x => x.id === id);
    for (const p of a.path) map.set(key(...p), id);
  }
  const head = arrow.path[arrow.headIndex];
  for (const p of rayCells(head, arrow.direction, rows, cols)) {
    if (map.has(key(...p))) return false;
  }
  return true;
}

export function validateGeometry(level) {
  const errors = [];
  const { rows, cols } = level.grid;
  const occupied = new Map();
  for (const a of level.arrows) {
    if (!Array.isArray(a.path) || a.path.length < 1) {
      errors.push(`Flèche ${a.id}: chemin invalide.`);
      continue;
    }
    for (let i = 0; i < a.path.length; i++) {
      const [r, c] = a.path[i];
      if (!inBounds(r, c, rows, cols)) errors.push(`Flèche ${a.id}: [${r},${c}] hors grille.`);
      const k = key(r, c);
      if (occupied.has(k)) errors.push(`Collision [${r},${c}].`);
      else occupied.set(k, a.id);
      if (i > 0) {
        const [pr, pc] = a.path[i - 1];
        if (Math.abs(r - pr) + Math.abs(c - pc) !== 1) errors.push(`Flèche ${a.id}: points non adjacents.`);
      }
    }
  }
  return { valid: errors.length === 0 && occupied.size === rows * cols, errors, coveredCells: occupied.size };
}

// ----------------------------------------------------------------------------
// Construction "en oignon" — garantit la solvabilité PAR CONSTRUCTION.
//
// Les flèches sont construites directement dans leur ordre de sortie : une
// case ne peut devenir tête d'une nouvelle flèche, dans une direction
// donnée, que si tout son rayon de sortie est déjà occupé par des flèches
// précédemment construites (ou sort immédiatement de la grille). Le premier
// pas du corps (juste derrière la tête) est forcé dans la direction opposée
// à la sortie, pour que le dernier segment du tracé soit toujours aligné
// avec la pointe.
// ----------------------------------------------------------------------------

function rayClearOnion(r, c, dir, owner, idx, rows, cols) {
  const [dr, dc] = DIRS[dir];
  let rr = r + dr, cc = c + dc;
  while (inBounds(rr, cc, rows, cols)) {
    if (owner[idx(rr, cc)] === -1) return false;
    rr += dr; cc += dc;
  }
  return true;
}

function computeOnionFrontier(owner, idx, rows, cols) {
  const list = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (owner[idx(r, c)] !== -1) continue;
      for (const dir of DIR_NAMES) {
        if (rayClearOnion(r, c, dir, owner, idx, rows, cols)) list.push({ r, c, dir });
      }
    }
  }
  return list;
}

function countFreeNeighborsOnion(r, c, owner, idx, rows, cols, used) {
  let n = 0;
  for (const dir of DIR_NAMES) {
    const [dr, dc] = DIRS[dir];
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc, rows, cols)) continue;
    if (owner[idx(nr, nc)] !== -1) continue;
    if (used.has(idx(nr, nc))) continue;
    n++;
  }
  return n;
}

function growArrowBody(hr, hc, dir, targetLen, owner, idx, rows, cols, rng) {
  const path = [[hr, hc]];
  const used = new Set([idx(hr, hc)]);
  if (targetLen <= 1) return path;

  const [odr, odc] = DIRS[opposite(dir)];
  const nr0 = hr + odr, nc0 = hc + odc;
  if (!inBounds(nr0, nc0, rows, cols) || owner[idx(nr0, nc0)] !== -1) {
    return path; // pas d'extension possible sans casser l'alignement
  }
  path.push([nr0, nc0]);
  used.add(idx(nr0, nc0));

  let cur = path[path.length - 1];
  while (path.length < targetLen) {
    const candidates = [];
    for (const d of DIR_NAMES) {
      const [dr, dc] = DIRS[d];
      const nr = cur[0] + dr, nc = cur[1] + dc;
      if (!inBounds(nr, nc, rows, cols)) continue;
      if (owner[idx(nr, nc)] !== -1) continue;
      if (used.has(idx(nr, nc))) continue;
      const freedom = countFreeNeighborsOnion(nr, nc, owner, idx, rows, cols, used);
      candidates.push({ nr, nc, freedom });
    }
    if (!candidates.length) break;
    candidates.sort((a, b) => a.freedom - b.freedom);
    const minFreedom = candidates[0].freedom;
    const best = rng.shuffle(candidates.filter(x => x.freedom === minFreedom));
    const chosen = best[0];
    path.push([chosen.nr, chosen.nc]);
    used.add(idx(chosen.nr, chosen.nc));
    cur = [chosen.nr, chosen.nc];
  }
  return path;
}

export function buildLevelOnion(rows, cols, minLen, maxLen, rng) {
  const N = rows * cols;
  const owner = new Int32Array(N).fill(-1);
  const idx = (r, c) => r * cols + c;
  const arrows = [];
  let nextId = 0, assignedCount = 0, guard = 0;

  while (assignedCount < N) {
    guard++;
    if (guard > N * 3) return null;

    const frontier = computeOnionFrontier(owner, idx, rows, cols);
    if (!frontier.length) return null;

    const extendable = frontier.filter(f => {
      const [odr, odc] = DIRS[opposite(f.dir)];
      const nr = f.r + odr, nc = f.c + odc;
      return inBounds(nr, nc, rows, cols) && owner[idx(nr, nc)] === -1;
    });
    const pool = extendable.length ? extendable : frontier;
    const pick = pool[rng.int(0, pool.length - 1)];
    const { r: hr, c: hc, dir } = pick;

    const remainingCells = N - assignedCount;
    const target = Math.min(remainingCells, rng.int(minLen, maxLen));
    const path = growArrowBody(hr, hc, dir, target, owner, idx, rows, cols, rng);

    for (const [r, c] of path) owner[idx(r, c)] = nextId;
    arrows.push({ id: nextId, path, headIndex: 0, direction: dir });
    assignedCount += path.length;
    nextId++;
  }
  return arrows;
}

// Génère un niveau complet (grille 40x40, 100% de couverture). `fast: true`
// (utilisé par le jeu) saute la recherche de score de difficulté et se
// contente de la première construction valide — nettement plus rapide,
// la solvabilité étant de toute façon garantie par construction.
export function generateLevel(options = {}) {
  const rows = options.rows ?? 40;
  const cols = options.cols ?? 40;
  const totalCells = rows * cols;

  const requestedArrows = Math.max(20, Number(options.arrows ?? 60));
  const avgLen = totalCells / requestedArrows;
  const minLen = Math.max(2, Math.round(Number(options.minLen ?? avgLen * 0.70)));
  const maxLen = Math.max(minLen + 1, Math.round(Number(options.maxLen ?? avgLen * 1.35)));

  const attempts = Math.max(1, Math.min(Number(options.attempts ?? (options.fast ? 5 : 40)), 80));
  const baseSeed = Number(options.seed ?? Date.now()) >>> 0;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const rng = makeRng((baseSeed + Math.imul(attempt + 1, 0x9E3779B9)) >>> 0);
    const arrows = buildLevelOnion(rows, cols, minLen, maxLen, rng);
    if (!arrows) continue;

    const deps = calculateDependencies(arrows, rows, cols);
    if (hasCycle(deps)) continue; // garde-fou (ne devrait jamais arriver)

    const solution = solveDependencies(deps);
    if (!solution) continue;

    return {
      id: options.id ?? 1,
      grid: { rows, cols, coverage: '100%' },
      arrows,
      solution
    };
  }

  throw new Error(`Impossible de générer un niveau après ${attempts} tentatives.`);
}
