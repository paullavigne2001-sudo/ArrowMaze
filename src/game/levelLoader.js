// ArrowMaze — levelLoader.js
// Reconstructs the full arrow paths from the compact JSON format.
//
// Compact format:
//   { id, start: [row, col], moves: "RDLU..." }
//
// The rest of the game can keep using arrow.path exactly as before.

const DIRECTIONS = Object.freeze({
  U: [-1, 0],
  R: [0, 1],
  D: [1, 0],
  L: [0, -1],
})

const VALID_DIRECTIONS = new Set(Object.keys(DIRECTIONS))

/**
 * Expand one compact arrow into its complete path.
 *
 * @param {object} arrow
 * @returns {object} a new arrow with path[]
 */
export function expandArrow(arrow) {
  if (!arrow || typeof arrow !== 'object') {
    throw new TypeError('Arrow invalide.')
  }

  // Backward compatibility with the old format.
  if (Array.isArray(arrow.path)) {
    return {
      ...arrow,
      path: arrow.path.map(([row, col]) => [row, col]),
    }
  }

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

  const path = [[row, col]]

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

  return {
    ...arrow,
    path,
  }
}

/**
 * Expand all arrows of a compact level.
 *
 * @param {object} level
 * @returns {object} a new level with reconstructed path[]
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
 * ArrowMaze levels are expected to cover every grid cell exactly once.
 *
 * @param {object} level
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
      `Couverture incorrecte : ${occupied.size}/${expectedCells} cases couvertes.`
    )
  }

  return true
}

/**
 * Return the direction represented by a move.
 */
export function getDirection(move) {
  return DIRECTIONS[move] ? move : null
}

/**
 * Return the direction of the last movement of an expanded arrow.
 * For a one-cell arrow, use its stored direction when available.
 */
export function getArrowDirection(arrow) {
  if (typeof arrow.moves === 'string' && arrow.moves.length > 0) {
    return arrow.moves[arrow.moves.length - 1]
  }

  if (VALID_DIRECTIONS.has(arrow?.direction)) {
    return arrow.direction
  }

  return null
}

export { DIRECTIONS }

export default loadLevel
