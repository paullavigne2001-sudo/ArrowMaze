// ArrowMaze — levelLoader.js
// Reconstructs the full arrow paths from the compact JSON format.

const DIRECTIONS = Object.freeze({
  U: [-1, 0],
  R: [0, 1],
  D: [1, 0],
  L: [0, -1],
})

const DIRECTION_NAMES = Object.freeze({
  U: 'up',
  R: 'right',
  D: 'down',
  L: 'left',
})

const OPPOSITE = Object.freeze({
  U: 'down',
  R: 'left',
  D: 'up',
  L: 'right',
})

function resolveDirection(arrow, path) {
  const headIndex = Number.isInteger(arrow.headIndex)
    ? arrow.headIndex
    : path.length - 1

  if (headIndex < 0 || headIndex >= path.length) {
    throw new Error(`Flèche ${arrow.id ?? '?'} : headIndex hors du chemin.`)
  }

  if (path.length <= 1) {
    throw new Error(`Flèche ${arrow.id ?? '?'} : chemin trop court pour déterminer la direction.`)
  }

  if (headIndex === 0) {
    return OPPOSITE[arrow.moves[0]] ?? null
  }

  if (headIndex === path.length - 1) {
    return DIRECTION_NAMES[arrow.moves[arrow.moves.length - 1]] ?? null
  }

  // A head in the middle of a path is ambiguous for this level format.
  throw new Error(
    `Flèche ${arrow.id ?? '?'} : headIndex doit être au début ou à la fin du chemin.`
  )
}

/**
 * Expand one compact arrow into its complete path.
 */
export function expandArrow(arrow) {
  if (!arrow || typeof arrow !== 'object') {
    throw new TypeError('Arrow invalide.')
  }

  let path

  if (Array.isArray(arrow.path)) {
    path = arrow.path.map(([row, col]) => [row, col])
  } else {
    if (!Array.isArray(arrow.start) || arrow.start.length !== 2) {
      throw new Error(`Flèche ${arrow.id ?? '?'} : start doit être [ligne, colonne].`)
    }

    if (typeof arrow.moves !== 'string') {
      throw new Error(`Flèche ${arrow.id ?? '?'} : moves doit être une chaîne de directions.`)
    }

    let row = Number(arrow.start[0])
    let col = Number(arrow.start[1])

    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      throw new Error(`Flèche ${arrow.id ?? '?'} : coordonnées de départ invalides.`)
    }

    path = [[row, col]]

    for (let i = 0; i < arrow.moves.length; i += 1) {
      const move = arrow.moves[i]
      const delta = DIRECTIONS[move]

      if (!delta) {
        throw new Error(
          `Flèche ${arrow.id ?? '?'} : direction invalide "${move}" à la position ${i}.`
        )
      }

      row += delta[0]
      col += delta[1]
      path.push([row, col])
    }
  }

  const direction = typeof arrow.moves === 'string'
    ? resolveDirection(arrow, path)
    : arrow.direction

  return {
    ...arrow,
    path,
    direction,
  }
}

/**
 * Expand all arrows of a compact level.
 */
export function loadLevel(level) {
  if (!level || typeof level !== 'object') {
    throw new TypeError('Niveau invalide.')
  }

  if (!Array.isArray(level.arrows)) {
    throw new Error('Le niveau doit contenir un tableau "arrows".')
  }

  const loadedLevel = {
    ...level,
    arrows: level.arrows.map(expandArrow),
  }

  validateLevel(loadedLevel)
  return loadedLevel
}

/**
 * Validate the reconstructed level.
 * Each grid cell must be covered exactly once.
 */
export function validateLevel(level) {
  const rows = level?.grid?.rows
  const cols = level?.grid?.cols

  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) {
    throw new Error('Dimensions de grille invalides.')
  }

  const occupied = new Set()

  for (const arrow of level.arrows) {
    if (!Array.isArray(arrow.path) || arrow.path.length === 0) {
      throw new Error(`Flèche ${arrow.id ?? '?'} : chemin vide.`)
    }

    for (const cell of arrow.path) {
      if (!Array.isArray(cell) || cell.length !== 2) {
        throw new Error(`Flèche ${arrow.id ?? '?'} : case invalide.`)
      }

      const [row, col] = cell

      if (
        !Number.isInteger(row) ||
        !Number.isInteger(col) ||
        row < 0 ||
        row >= rows ||
        col < 0 ||
        col >= cols
      ) {
        throw new Error(
          `Flèche ${arrow.id ?? '?'} : case [${row}, ${col}] hors de la grille.`
        )
      }

      const key = `${row},${col}`

      if (occupied.has(key)) {
        throw new Error(
          `La case [${row}, ${col}] appartient à plusieurs flèches.`
        )
      }

      occupied.add(key)
    }
  }

  const expectedCells = rows * cols

  if (occupied.size !== expectedCells) {
    throw new Error(
      `Couverture incomplète : ${occupied.size} / ${expectedCells} cases.`
    )
  }

  return true
}
