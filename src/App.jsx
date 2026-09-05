  const points = arrow.path
    .map(([row, col]) => `${col + 0.5},${row + 0.5}`)
    .join(' ')

  const headIndex = Number.isInteger(arrow.headIndex)
    ? Math.max(0, Math.min(arrow.headIndex, arrow.path.length - 1))
    : arrow.path.length - 1

  const [headRow, headCol] = arrow.path[headIndex]
  const direction = arrow.direction || 'right'
  const angle = DIR_ANGLE[direction] ?? 0
  const size = 0.32

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
        r="0.19"
        fill={ARROW_COLOR}
        stroke="white"
        strokeWidth="0.02"
      />

      <polygon
        points={`0,-${size} ${size * 1.35},${size} 0,${size * 0.48} -${size * 1.35},${size}`}
        fill={ARROW_COLOR}
        stroke="white"