import { useMemo } from 'react'
import compactLevel from './data/levels.js'
import { loadLevel } from './game/levelLoader.js'
import './App.css'

const ARROW_COLOR = '#5ee7ff'

const DIR_ANGLE = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
  R: 0,
  D: 90,
  L: 180,
  U: 270,
}

function ArrowShape({ arrow }) {
  const points = arrow.path
    .map(([row, col]) => `${col + 0.5},${row + 0.5}`)
    .join(' ')

  const headIndex = Number.isInteger(arrow.headIndex)
    ? Math.max(0, Math.min(arrow.headIndex, arrow.path.length - 1))
    : arrow.path.length - 1

  const [headRow, headCol] = arrow.path[headIndex]
  const direction = arrow.direction || 'right'
  const angle = DIR_ANGLE[direction] ?? 0
  const size = 0.18

  return (
    <g className="arrow-shape">
      <polyline
        points={points}
        fill="none"
        stroke="white"
        strokeWidth="0.20"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <polyline
        points={points}
        fill="none"
        stroke={ARROW_COLOR}
        strokeWidth="0.14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx={headCol + 0.5}
        cy={headRow + 0.5}
        r="0.11"
        fill={ARROW_COLOR}
        stroke="white"
        strokeWidth="0.02"
      />

      <polygon
        points={`0,-${size} ${size * 1.35},${size} 0,${size * 0.48} -${size * 1.35},${size}`}
        fill={ARROW_COLOR}
        stroke="white"
        strokeWidth="0.02"
        strokeLinejoin="round"
        transform={`translate(${headCol + 0.5} ${headRow + 0.5}) rotate(${angle})`}
      />
    </g>
  )
}

function ArrowMazeBoard({ level }) {
  const { rows, cols } = level.grid

  return (
    <div className="board-wrap">
      <svg
        className="maze-board"
        viewBox={`0 0 ${cols} ${rows}`}
        role="img"
        aria-label={`Niveau ${level.id}, grille ${rows} par ${cols}`}
      >
        <rect x="0" y="0" width={cols} height={rows} className="board-bg" />

        <g className="grid-lines">
          {Array.from({ length: rows + 1 }, (_, i) => (
            <line key={`h-${i}`} x1="0" y1={i} x2={cols} y2={i} />
          ))}
          {Array.from({ length: cols + 1 }, (_, i) => (
            <line key={`v-${i}`} x1={i} y1="0" x2={i} y2={rows} />
          ))}
        </g>

        {level.arrows.map((arrow, index) => (
          <ArrowShape key={arrow.id ?? index} arrow={arrow} />
        ))}
      </svg>
    </div>
}

export default App
