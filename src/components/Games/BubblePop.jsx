import { useEffect, useRef, useState, useCallback } from 'react'

const COLORS = ['#818cf8', '#34d399', '#fb923c', '#f472b6', '#60a5fa', '#a78bfa', '#4ade80', '#fbbf24']

const DIFF_CONFIG = {
  easy:   { spawnRate: 0.016, speedMin: 0.7, speedRange: 0.8, radMin: 34, radRange: 26, questionEvery: 3 },
  medium: { spawnRate: 0.025, speedMin: 1.2, speedRange: 1.4, radMin: 28, radRange: 28, questionEvery: 5 },
  hard:   { spawnRate: 0.042, speedMin: 1.9, speedRange: 2.0, radMin: 16, radRange: 18, questionEvery: 8 },
}

function makeBubble(id, canvasW, canvasH, diff) {
  const r = diff.radMin + Math.random() * diff.radRange
  return {
    id,
    x: r + Math.random() * (canvasW - r * 2),
    y: canvasH + r,
    r,
    vx: (Math.random() - 0.5) * 1.2,
    vy: -(diff.speedMin + Math.random() * diff.speedRange),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    popped: false,
  }
}

export function BubblePop({ onNeedQuestion, difficulty = 'medium' }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ bubbles: [], nextId: 0, score: 0, frameId: null, totalPopped: 0 })
  const diffRef = useRef(DIFF_CONFIG[difficulty] ?? DIFF_CONFIG.medium)
  const [score, setScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)

  const getCanvas = () => canvasRef.current

  const draw = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { bubbles } = stateRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, '#eef2ff')
    grad.addColorStop(1, '#ddd6fe')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    bubbles.forEach(b => {
      if (b.popped) return
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fillStyle = b.color + 'cc'
      ctx.fill()
      ctx.strokeStyle = b.color
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.fill()
    })

    ctx.fillStyle = '#4338ca'
    ctx.font = 'bold 22px system-ui'
    ctx.fillText(`🫧 ${stateRef.current.score}`, 16, 34)

    // Difficulty badge
    const diff = diffRef.current
    const label = difficulty === 'easy' ? '🐢' : difficulty === 'hard' ? '🚀' : '🐇'
    ctx.fillStyle = 'rgba(67,56,202,0.5)'
    ctx.font = '14px system-ui'
    ctx.fillText(label, canvas.width - 30, 28)
  }, [difficulty])

  const loop = useCallback(() => {
    if (pausedRef.current) return
    const canvas = getCanvas()
    if (!canvas) return
    const s = stateRef.current
    const diff = diffRef.current

    if (Math.random() < diff.spawnRate) {
      s.bubbles.push(makeBubble(s.nextId++, canvas.width, canvas.height, diff))
    }

    s.bubbles = s.bubbles.filter(b => b.y + b.r > -50 && !b.popped)
    s.bubbles.forEach(b => {
      b.x += b.vx
      b.y += b.vy
      if (b.x - b.r < 0 || b.x + b.r > canvas.width) b.vx *= -1
    })

    draw()
    s.frameId = requestAnimationFrame(loop)
  }, [draw])

  useEffect(() => {
    diffRef.current = DIFF_CONFIG[difficulty] ?? DIFF_CONFIG.medium
    const canvas = getCanvas()
    if (!canvas) return
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    stateRef.current.frameId = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(stateRef.current.frameId)
    }
  }, [loop, difficulty])

  const handleClick = useCallback((e) => {
    if (pausedRef.current) return
    const canvas = getCanvas()
    const rect = canvas.getBoundingClientRect()
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left
    const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top
    const s = stateRef.current
    let popped = false
    s.bubbles.forEach(b => {
      if (!b.popped && Math.hypot(cx - b.x, cy - b.y) < b.r) {
        b.popped = true
        s.score++
        s.totalPopped++
        popped = true
      }
    })
    if (popped) {
      setScore(s.score)
      if (s.totalPopped > 0 && s.totalPopped % diffRef.current.questionEvery === 0) {
        pausedRef.current = true
        setPaused(true)
        cancelAnimationFrame(s.frameId)
        onNeedQuestion((result) => {
          pausedRef.current = false
          setPaused(false)
          s.frameId = requestAnimationFrame(loop)
        })
      }
    }
  }, [loop, onNeedQuestion])

  return (
    <div className="relative w-full h-full select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none cursor-pointer"
        onClick={handleClick}
        onTouchStart={handleClick}
      />
      {paused && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <div className="text-2xl font-bold text-indigo-600 animate-pulse">Question time! ✏️</div>
        </div>
      )}
    </div>
  )
}
