import { useEffect, useRef, useState, useCallback } from 'react'

const FISH_EMOJIS = ['🐠', '🐡', '🐟', '🦈', '🐙', '🦑']

const DIFF_CONFIG = {
  easy:   { spawnRate: 0.013, speedMin: 1.0, speedRange: 1.0, sizeMin: 38, sizeRange: 18, questionEvery: 3 },
  medium: { spawnRate: 0.018, speedMin: 1.5, speedRange: 2.0, sizeMin: 30, sizeRange: 20, questionEvery: 5 },
  hard:   { spawnRate: 0.032, speedMin: 2.8, speedRange: 2.5, sizeMin: 20, sizeRange: 14, questionEvery: 7 },
}

function makeFish(id, canvasW, canvasH, diff) {
  const fromLeft = Math.random() > 0.5
  const speed = diff.speedMin + Math.random() * diff.speedRange
  return {
    id,
    x: fromLeft ? -60 : canvasW + 60,
    y: 60 + Math.random() * (canvasH - 120),
    vx: fromLeft ? speed : -speed,
    emoji: FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)],
    size: diff.sizeMin + Math.random() * diff.sizeRange,
    caught: false,
  }
}

export function FishCatch({ onNeedQuestion, difficulty = 'medium' }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ fish: [], nextId: 0, score: 0, frameId: null, totalCaught: 0 })
  const diffRef = useRef(DIFF_CONFIG[difficulty] ?? DIFF_CONFIG.medium)
  const [score, setScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, '#bae6fd')
    grad.addColorStop(1, '#0369a1')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      const y = (canvas.height * (i + 1)) / 6
      ctx.moveTo(0, y)
      for (let x = 0; x <= canvas.width; x += 40) {
        ctx.quadraticCurveTo(x + 20, y - 8, x + 40, y)
      }
      ctx.stroke()
    }

    stateRef.current.fish.forEach(f => {
      if (f.caught) return
      ctx.save()
      ctx.translate(f.x, f.y)
      if (f.vx < 0) ctx.scale(-1, 1)
      ctx.font = `${f.size}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(f.emoji, 0, 0)
      ctx.restore()
    })

    ctx.fillStyle = 'white'
    ctx.font = 'bold 22px system-ui'
    ctx.fillText(`🎣 ${stateRef.current.score}`, 16, 34)

    const label = difficulty === 'easy' ? '🐢' : difficulty === 'hard' ? '🚀' : '🐇'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '14px system-ui'
    ctx.fillText(label, canvas.width - 30, 28)
  }, [difficulty])

  const loop = useCallback(() => {
    if (pausedRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current
    const diff = diffRef.current

    if (Math.random() < diff.spawnRate) {
      s.fish.push(makeFish(s.nextId++, canvas.width, canvas.height, diff))
    }

    s.fish = s.fish.filter(f => f.x > -100 && f.x < canvas.width + 100 && !f.caught)
    s.fish.forEach(f => { f.x += f.vx })

    draw()
    s.frameId = requestAnimationFrame(loop)
  }, [draw])

  useEffect(() => {
    diffRef.current = DIFF_CONFIG[difficulty] ?? DIFF_CONFIG.medium
    const canvas = canvasRef.current
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
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left
    const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top
    const s = stateRef.current
    let caught = false
    s.fish.forEach(f => {
      if (!f.caught && Math.hypot(cx - f.x, cy - f.y) < f.size) {
        f.caught = true
        s.score++
        s.totalCaught++
        caught = true
      }
    })
    if (caught) {
      setScore(s.score)
      if (s.totalCaught > 0 && s.totalCaught % diffRef.current.questionEvery === 0) {
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
        className="w-full h-full touch-none cursor-crosshair"
        onClick={handleClick}
        onTouchStart={handleClick}
      />
      {paused && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <div className="text-2xl font-bold text-sky-600 animate-pulse">Question time! ✏️</div>
        </div>
      )}
    </div>
  )
}
