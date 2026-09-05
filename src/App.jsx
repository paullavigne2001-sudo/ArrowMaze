import { useMemo } from 'react'
import compactLevel from './data/levels.js'
import { loadLevel } from './game/levelLoader.js'
import './App.css'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
]

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

function ArrowShape({ arrow, index, rows, cols }) {
  const color = COLORS[index % COLORS.length]
  const points = arrow.path
    .map(([row, col]) => `${col + 0.5},${row + 0.5}`)
    .join(' ')

  const headIndex = Number.isInteger(arrow.headIndex)
    ? Math.max(0, Math.min(arrow.headIndex, arrow.path.length - 1))
    : arrow.path.length - 1

  const [headRow, headCol] = arrow.path[headIndex]
  const direction = arrow.direction || 'right'
  const angle = DIR_ANGLE[direction] ?? 0
  const size = 0.36

  return (
    <g className="arrow-shape">
      <polyline
        points={points}
        fill="none"
        stroke="white"
        strokeWidth="0.78"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="0.58"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx={headCol + 0.5}
        cy={headRow + 0.5}
        r="0.29"
        fill={color}
        stroke="white"
        strokeWidth="0.09"
      />

      <polygon
        points={`0,-${size} ${size * 1.35},${size} 0,${size * 0.48} -${size * 1.35},${size}`}
        fill={color}
        stroke="white"
        strokeWidth="0.09"
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
          <ArrowShape
            key={arrow.id ?? index}
            arrow={arrow}
            index={index}
            rows={rows}
            cols={cols}
          />
        ))}
      </svg>
    </div>
  )
}

function App() {
  const level = useMemo(() => loadLevel(compactLevel), [])

  const coveredCells = useMemo(
    () => level.arrows.reduce((total, arrow) => total + arrow.path.length, 0),
    [level],
  )

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <div className="eyebrow">PUZZLE</div>
          <h1>ArrowMaze</h1>
        </div>
        <div className="level-badge">NIVEAU {level.id}</div>
      </header>

      <section className="game-card">
        <ArrowMazeBoard level={level} />

        <div className="level-info">
          <span><strong>{level.arrows.length}</strong> flèches</span>
          <span><strong>{coveredCells}</strong> / {level.grid.rows * level.grid.cols} cases</span>
          <span>40 × 40</span>
        </div>
      </section>
    </main>
  )
}

export default App
