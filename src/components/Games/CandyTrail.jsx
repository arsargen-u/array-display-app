import { useState, useMemo } from 'react'

const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']

const COLOR_STYLE = {
  red:    'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-300',
  green:  'bg-green-400',
  blue:   'bg-blue-400',
  purple: 'bg-purple-400',
}

const COLOR_PILL = {
  red:    'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-400 text-gray-800',
  green:  'bg-green-500 text-white',
  blue:   'bg-blue-500 text-white',
  purple: 'bg-purple-500 text-white',
}

function makePath(length) {
  const counts = {}
  COLORS.forEach(c => { counts[c] = 0 })
  const path = []
  for (let i = 0; i < length - 1; i++) {
    const min = Math.min(...Object.values(counts))
    const eligible = COLORS.filter(c => counts[c] === min)
    const color = eligible[Math.floor(Math.random() * eligible.length)]
    path.push(color)
    counts[color]++
  }
  path.push('star')
  return path
}

export function CandyTrail({ onNeedQuestion, difficulty = 'medium' }) {
  const pathLength = difficulty === 'easy' ? 16 : difficulty === 'hard' ? 28 : 22
  const COLS = 6

  const [path] = useState(() => makePath(pathLength))
  const [playerPos, setPlayerPos] = useState(-1)  // -1 = at START
  const [waiting, setWaiting] = useState(false)
  const [drawnColor, setDrawnColor] = useState(null)
  const [score, setScore] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [message, setMessage] = useState(null)

  const handleDraw = () => {
    if (waiting || gameWon) return

    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    setDrawnColor(color)

    // Find next square of this color after current position
    const nextPos = path.findIndex((c, i) => i > playerPos && c === color)

    const prevPos = playerPos
    let targetPos

    if (nextPos === -1) {
      // No more of this color ahead → jump to the win space
      targetPos = path.length - 1
    } else {
      targetPos = nextPos
    }

    setPlayerPos(targetPos)
    setWaiting(true)
    setMessage(null)

    onNeedQuestion((result) => {
      if (result?.correct) {
        setScore(s => s + 1)
        setMessage('✓ Correct! Stay here.')
        if (targetPos >= path.length - 1) {
          setGameWon(true)
        }
      } else {
        setPlayerPos(prevPos)
        setMessage('✗ Move back — try again!')
      }
      setWaiting(false)
      setDrawnColor(null)
      setTimeout(() => setMessage(null), 1500)
    })
  }

  // Build snake-grid layout
  const rows = Math.ceil(path.length / COLS)
  const grid = useMemo(() => {
    const built = []
    for (let r = 0; r < rows; r++) {
      const start = r * COLS
      const slice = path.slice(start, Math.min(start + COLS, path.length))
      // Build with actual path indices
      const row = slice.map((color, c) => {
        const pathIdx = r % 2 === 0 ? start + c : start + (slice.length - 1 - c)
        return { color, pathIdx }
      })
      // Reverse odd rows visually for snake effect
      if (r % 2 === 1) row.reverse()
      built.push(row)
    }
    return built
  }, [path, rows])

  return (
    <div className="flex flex-col h-full bg-pink-50 select-none">
      {/* Header */}
      <div className="bg-pink-600 text-white px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍬</span>
          <span className="font-bold text-lg">Candy Trail</span>
        </div>
        <span className="text-sm text-pink-200">
          {playerPos === -1 ? 'At Start' : `Step ${playerPos + 1} / ${path.length}`}
          {' · '}✓ {score}
        </span>
      </div>

      {gameWon ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="text-8xl animate-bounce">🏆</div>
          <h2 className="text-3xl font-bold text-pink-700">You made it!</h2>
          <p className="text-gray-500 text-center">You reached the end of the Candy Trail!</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Board */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-pink-100">
            {/* START row */}
            <div className="flex items-center mb-1.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold border-2 ${
                playerPos === -1
                  ? 'bg-pink-100 border-pink-500 shadow-md scale-110'
                  : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}>
                {playerPos === -1 ? '🌟' : 'GO'}
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-1 rounded" />
            </div>

            {/* Snake grid */}
            {grid.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1.5 mb-1.5 justify-start">
                {row.map(({ color, pathIdx }) => {
                  const isPlayer = playerPos === pathIdx
                  const isStar = color === 'star'
                  return (
                    <div
                      key={pathIdx}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border-2 transition-all duration-300 ${
                        isStar
                          ? 'bg-gradient-to-br from-yellow-300 to-amber-400 border-amber-500'
                          : COLOR_STYLE[color]
                      } ${isPlayer ? 'border-gray-900 shadow-lg scale-110 z-10 relative' : 'border-transparent'}`}
                    >
                      {isPlayer ? '🌟' : isStar ? '🏆' : ''}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Drawn color indicator */}
          {drawnColor && (
            <div className={`text-center py-3 px-6 rounded-2xl font-bold text-xl ${COLOR_PILL[drawnColor]} shadow-md`}>
              {drawnColor.toUpperCase()}!
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`text-center py-2 px-4 rounded-xl text-sm font-semibold ${
              message.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Draw button */}
          <button
            onClick={handleDraw}
            disabled={waiting || gameWon}
            className={`w-full py-5 rounded-2xl font-bold text-2xl shadow-lg transition-all active:scale-95 ${
              waiting || gameWon
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-pink-500 hover:bg-pink-400 text-white'
            }`}
          >
            {waiting ? 'Answering question...' : '🎴 Draw a Card'}
          </button>

          {/* Color key */}
          <div className="flex justify-center gap-2 flex-wrap pb-2">
            {COLORS.map(c => (
              <div key={c} className={`w-6 h-6 rounded-md ${COLOR_STYLE[c]} opacity-80`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
