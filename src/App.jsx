import { useMemo } from 'react'
import compactLevel from './data/levels.js'
import { loadLevel } from './game/levelLoader.js'
import './App.css'

function App() {
  const level = useMemo(() => loadLevel(compactLevel), [])

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>ArrowMaze</h1>

      <p>
        Niveau <strong>{level.id}</strong> chargé avec succès.
      </p>

      <ul>
        <li>
          Grille : {level.grid.rows} × {level.grid.cols}
        </li>
        <li>
          Flèches : {level.arrows.length}
        </li>
        <li>
          Cases reconstruites : {level.arrows.reduce((total, arrow) => total + arrow.path.length, 0)}
        </li>
        <li>
          Format : {level.format}
        </li>
      </ul>

      <p>Le levelLoader reconstruit automatiquement les <code>path[]</code> à partir de <code>start + moves</code>.</p>
    </main>
  )
}

export default App
