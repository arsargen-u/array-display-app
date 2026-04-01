import { useState, useCallback } from 'react'

// --- SVG region definitions ---
// Each picture has named regions and their SVG elements.
// We support: Rainbow, Sun, Flower.

const PALETTE = [
  { id: 'red',    hex: '#EF4444', label: 'Red' },
  { id: 'orange', hex: '#F97316', label: 'Orange' },
  { id: 'yellow', hex: '#EAB308', label: 'Yellow' },
  { id: 'green',  hex: '#22C55E', label: 'Green' },
  { id: 'blue',   hex: '#3B82F6', label: 'Blue' },
  { id: 'purple', hex: '#A855F7', label: 'Purple' },
  { id: 'pink',   hex: '#EC4899', label: 'Pink' },
  { id: 'brown',  hex: '#92400E', label: 'Brown' },
  { id: 'white',  hex: '#F9FAFB', label: 'White' },
  { id: 'black',  hex: '#1F2937', label: 'Black' },
]

// --- Donut arc path helper ---
// Creates filled half-donut arc pointing upward (bottom half of SVG)
function arcPath(cx, cy, outerR, innerR) {
  return [
    `M ${cx - outerR} ${cy}`,
    `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}`,
    `L ${cx + innerR} ${cy}`,
    `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}`,
    'Z',
  ].join(' ')
}

const PICTURES = {
  rainbow: {
    label: 'Rainbow',
    emoji: '🌈',
    viewBox: '0 0 400 280',
    regions: [
      { id: 'sky',    label: 'Sky',      order: 0 },
      { id: 'grass',  label: 'Grass',    order: 1 },
      { id: 'arc_r',  label: 'Red Band', order: 2 },
      { id: 'arc_o',  label: 'Orange Band', order: 3 },
      { id: 'arc_y',  label: 'Yellow Band', order: 4 },
      { id: 'arc_g',  label: 'Green Band', order: 5 },
      { id: 'arc_b',  label: 'Blue Band', order: 6 },
      { id: 'sun',    label: 'Sun',      order: 7 },
      { id: 'cloud',  label: 'Cloud',    order: 8 },
    ],
    render: ({ fills, onRegionClick, activeRegion }) => {
      const cx = 200, cy = 268
      const fill = (id, def) => fills[id] ?? def

      return (
        <g>
          {/* Sky */}
          <rect
            id="sky" x="0" y="0" width="400" height="280"
            fill={fill('sky', '#DBEAFE')}
            onClick={() => onRegionClick('sky')}
            className="cursor-pointer hover:brightness-110 transition-all"
            style={{ outline: activeRegion === 'sky' ? '3px solid #6366F1' : undefined }}
          />
          {/* Rainbow arcs — bottom to top so red is outermost */}
          {[
            { id: 'arc_b', outer: 80,  inner: 55,  def: '#93C5FD' },
            { id: 'arc_g', outer: 105, inner: 82,  def: '#86EFAC' },
            { id: 'arc_y', outer: 130, inner: 107, def: '#FDE047' },
            { id: 'arc_o', outer: 155, inner: 132, def: '#FED7AA' },
            { id: 'arc_r', outer: 180, inner: 157, def: '#FCA5A5' },
          ].map(({ id, outer, inner, def }) => (
            <path
              key={id}
              d={arcPath(cx, cy, outer, inner)}
              fill={fill(id, def)}
              onClick={() => onRegionClick(id)}
              className="cursor-pointer hover:brightness-110 transition-all"
              stroke="white"
              strokeWidth="1"
            />
          ))}
          {/* Grass */}
          <rect
            id="grass" x="0" y="248" width="400" height="32"
            fill={fill('grass', '#86EFAC')}
            onClick={() => onRegionClick('grass')}
            className="cursor-pointer hover:brightness-110 transition-all"
          />
          {/* Sun */}
          <circle
            cx="55" cy="52" r="28"
            fill={fill('sun', '#FDE047')}
            onClick={() => onRegionClick('sun')}
            className="cursor-pointer hover:brightness-110 transition-all"
          />
          {/* Sun rays */}
          {[0,45,90,135].map(deg => (
            <rect
              key={deg}
              x="49" y="14" width="12" height="22" rx="4"
              fill={fill('sun', '#FDE047')}
              transform={`rotate(${deg} 55 52)`}
              onClick={() => onRegionClick('sun')}
              className="cursor-pointer hover:brightness-110 transition-all"
            />
          ))}
          {/* Cloud */}
          {[
            { cx: 300, cy: 62, r: 18 },
            { cx: 322, cy: 52, r: 24 },
            { cx: 348, cy: 62, r: 18 },
          ].map((c, i) => (
            <circle
              key={i} cx={c.cx} cy={c.cy} r={c.r}
              fill={fill('cloud', '#F1F5F9')}
              onClick={() => onRegionClick('cloud')}
              className="cursor-pointer hover:brightness-110 transition-all"
            />
          ))}
          {/* Active region highlight ring */}
          {activeRegion === 'sky' && (
            <rect x="2" y="2" width="396" height="276" fill="none" stroke="#6366F1" strokeWidth="3" strokeDasharray="8,4" rx="4" />
          )}
        </g>
      )
    },
  },

  sun: {
    label: 'Big Sun',
    emoji: '☀️',
    viewBox: '0 0 400 300',
    regions: [
      { id: 'sky',    label: 'Sky',    order: 0 },
      { id: 'sun',    label: 'Center', order: 1 },
      { id: 'ray0',   label: 'Ray 1',  order: 2 },
      { id: 'ray1',   label: 'Ray 2',  order: 3 },
      { id: 'ray2',   label: 'Ray 3',  order: 4 },
      { id: 'ray3',   label: 'Ray 4',  order: 5 },
      { id: 'ray4',   label: 'Ray 5',  order: 6 },
      { id: 'ray5',   label: 'Ray 6',  order: 7 },
      { id: 'ray6',   label: 'Ray 7',  order: 8 },
      { id: 'ray7',   label: 'Ray 8',  order: 9 },
    ],
    render: ({ fills, onRegionClick }) => {
      const fill = (id, def) => fills[id] ?? def
      const cx = 200, cy = 150
      const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315]
      return (
        <g>
          <rect x="0" y="0" width="400" height="300"
            fill={fill('sky', '#BAE6FD')}
            onClick={() => onRegionClick('sky')}
            className="cursor-pointer hover:brightness-110"
          />
          {rayAngles.map((angle, i) => (
            <rect
              key={i}
              id={`ray${i}`}
              x={cx - 10} y={cy - 110}
              width="20" height="58" rx="8"
              fill={fill(`ray${i}`, '#FDE047')}
              transform={`rotate(${angle} ${cx} ${cy})`}
              onClick={() => onRegionClick(`ray${i}`)}
              className="cursor-pointer hover:brightness-110 transition-all"
            />
          ))}
          <circle cx={cx} cy={cy} r="70"
            fill={fill('sun', '#FDE047')}
            onClick={() => onRegionClick('sun')}
            className="cursor-pointer hover:brightness-110 transition-all"
            stroke="white" strokeWidth="2"
          />
          {/* Smiley face */}
          <circle cx={cx - 22} cy={cy - 12} r="8" fill="rgba(0,0,0,0.12)" />
          <circle cx={cx + 22} cy={cy - 12} r="8" fill="rgba(0,0,0,0.12)" />
          <path d={`M ${cx-24} ${cy+16} Q ${cx} ${cy+38} ${cx+24} ${cy+16}`}
            fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="5" strokeLinecap="round" />
        </g>
      )
    },
  },

  flower: {
    label: 'Flower',
    emoji: '🌸',
    viewBox: '0 0 400 300',
    regions: [
      { id: 'bg',      label: 'Background', order: 0 },
      { id: 'stem',    label: 'Stem',       order: 1 },
      { id: 'petal0',  label: 'Petal 1',    order: 2 },
      { id: 'petal1',  label: 'Petal 2',    order: 3 },
      { id: 'petal2',  label: 'Petal 3',    order: 4 },
      { id: 'petal3',  label: 'Petal 4',    order: 5 },
      { id: 'petal4',  label: 'Petal 5',    order: 6 },
      { id: 'petal5',  label: 'Petal 6',    order: 7 },
      { id: 'center',  label: 'Center',     order: 8 },
    ],
    render: ({ fills, onRegionClick }) => {
      const fill = (id, def) => fills[id] ?? def
      const cx = 200, cy = 140, pr = 55  // petal radius from center
      const petalAngles = [0, 60, 120, 180, 240, 300]
      return (
        <g>
          <rect x="0" y="0" width="400" height="300"
            fill={fill('bg', '#ECFDF5')}
            onClick={() => onRegionClick('bg')}
            className="cursor-pointer hover:brightness-110"
          />
          {/* Stem */}
          <rect
            x={cx - 10} y={cy + 48} width="20" height="110" rx="10"
            fill={fill('stem', '#86EFAC')}
            onClick={() => onRegionClick('stem')}
            className="cursor-pointer hover:brightness-110"
          />
          {/* Petals */}
          {petalAngles.map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            const px = cx + pr * Math.sin(rad)
            const py = cy - pr * Math.cos(rad)
            return (
              <ellipse
                key={i}
                id={`petal${i}`}
                cx={px} cy={py}
                rx="28" ry="42"
                fill={fill(`petal${i}`, '#FDA4AF')}
                transform={`rotate(${angle} ${px} ${py})`}
                onClick={() => onRegionClick(`petal${i}`)}
                className="cursor-pointer hover:brightness-110 transition-all"
                stroke="white" strokeWidth="2"
              />
            )
          })}
          {/* Center */}
          <circle cx={cx} cy={cy} r="38"
            fill={fill('center', '#FDE047')}
            onClick={() => onRegionClick('center')}
            className="cursor-pointer hover:brightness-110 transition-all"
            stroke="white" strokeWidth="2"
          />
        </g>
      )
    },
  },
}

export function ColoringGame({ onNeedQuestion, difficulty = 'medium' }) {
  const [pictureKey, setPictureKey] = useState('rainbow')
  const [fills, setFills] = useState({})
  const [activeRegion, setActiveRegion] = useState(null)  // region awaiting color pick
  const [waiting, setWaiting] = useState(false)
  const [unlockedCount, setUnlockedCount] = useState(difficulty === 'easy' ? 4 : difficulty === 'hard' ? 2 : 3)
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState(null)

  const picture = PICTURES[pictureKey]
  const totalRegions = picture.regions.length
  const coloredCount = Object.keys(fills).filter(k => k.startsWith(picture.regions[0]?.id?.split('_')[0]) || picture.regions.some(r => r.id === k)).length

  const isComplete = picture.regions.every(r => fills[r.id])

  const handleRegionClick = useCallback((regionId) => {
    if (waiting) return
    const region = picture.regions.find(r => r.id === regionId)
    if (!region) return
    if (region.order >= unlockedCount) {
      setMessage(`Answer ${region.order - unlockedCount + 1} more question(s) to unlock!`)
      setTimeout(() => setMessage(null), 1800)
      return
    }
    setActiveRegion(regionId)
  }, [waiting, picture.regions, unlockedCount])

  const handleColorSelect = useCallback((colorHex) => {
    if (!activeRegion || waiting) return
    const regionId = activeRegion
    setFills(prev => ({ ...prev, [regionId]: colorHex }))
    setActiveRegion(null)
    setWaiting(true)

    onNeedQuestion((result) => {
      if (result?.correct) {
        setScore(s => s + 1)
        setUnlockedCount(u => Math.min(u + 1, totalRegions))
        setMessage('✓ Nice! A new region is unlocked.')
      } else {
        // Remove the fill
        setFills(prev => { const n = { ...prev }; delete n[regionId]; return n })
        setMessage('✗ Try again to keep that color!')
      }
      setWaiting(false)
      setTimeout(() => setMessage(null), 1800)
    })
  }, [activeRegion, waiting, onNeedQuestion, totalRegions])

  const resetPicture = () => {
    setFills({})
    setActiveRegion(null)
    setWaiting(false)
    setUnlockedCount(difficulty === 'easy' ? 4 : difficulty === 'hard' ? 2 : 3)
    setScore(0)
  }

  const SvgContent = picture.render

  return (
    <div className="flex flex-col h-full bg-teal-50 select-none">
      {/* Header */}
      <div className="bg-teal-600 text-white px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          <span className="font-bold text-lg">Coloring Book</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-teal-200">
            {Object.keys(fills).length}/{totalRegions} colored · ✓ {score}
          </span>
          <button onClick={resetPicture} className="text-xs text-teal-200 hover:text-white underline">Reset</button>
        </div>
      </div>

      {/* Picture picker */}
      <div className="bg-white border-b border-teal-100 px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
        {Object.entries(PICTURES).map(([key, pic]) => (
          <button
            key={key}
            onClick={() => { setPictureKey(key); resetPicture() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              pictureKey === key
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{pic.emoji}</span>
            <span>{pic.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {isComplete ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            <div className="text-8xl animate-bounce">🎨</div>
            <h2 className="text-3xl font-bold text-teal-700">Masterpiece complete!</h2>
            <button
              onClick={resetPicture}
              className="px-10 py-3 bg-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
            >
              Color Again 🖌️
            </button>
          </div>
        ) : (
          <>
            {/* SVG canvas */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-3">
              <svg
                viewBox={picture.viewBox}
                className="w-full h-full max-h-64 rounded-2xl shadow-md border border-teal-100 bg-white"
                style={{ touchAction: 'none' }}
              >
                <SvgContent
                  fills={fills}
                  onRegionClick={handleRegionClick}
                  activeRegion={activeRegion}
                />
                {/* Highlight locked regions with stripe pattern */}
                <defs>
                  <pattern id="locked" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#D1D5DB" strokeWidth="2"/>
                  </pattern>
                </defs>
              </svg>
            </div>

            {/* Region legend / unlock status */}
            <div className="px-4 pb-1 flex gap-1.5 overflow-x-auto flex-shrink-0">
              {picture.regions.map((region, i) => (
                <div
                  key={region.id}
                  className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
                    fills[region.id]
                      ? 'bg-teal-100 border-teal-300 text-teal-700'
                      : i < unlockedCount
                        ? 'bg-white border-gray-300 text-gray-600 cursor-pointer hover:bg-gray-50'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                  onClick={() => i < unlockedCount && !fills[region.id] && handleRegionClick(region.id)}
                >
                  <span>{fills[region.id] ? '✓' : i < unlockedCount ? '○' : '🔒'}</span>
                  <span>{region.label}</span>
                </div>
              ))}
            </div>

            {/* Message */}
            {message && (
              <div className={`mx-4 mb-1 text-center py-2 rounded-xl text-sm font-semibold flex-shrink-0 ${
                message.startsWith('✓') ? 'bg-green-100 text-green-700' :
                message.startsWith('✗') ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {message}
              </div>
            )}

            {/* Color picker */}
            {activeRegion && (
              <div className="bg-white border-t border-teal-200 px-4 py-3 flex-shrink-0 shadow-lg">
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  Choose a color for <strong>{picture.regions.find(r => r.id === activeRegion)?.label}</strong>:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map(color => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color.hex)}
                      className="w-9 h-9 rounded-xl border-2 border-white shadow-md active:scale-90 transition-transform hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                  <button
                    onClick={() => setActiveRegion(null)}
                    className="w-9 h-9 rounded-xl bg-gray-200 text-gray-600 text-xs font-bold border-2 border-white shadow-md hover:bg-gray-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Idle footer */}
            {!activeRegion && (
              <div className="border-t border-teal-100 py-2 text-center flex-shrink-0">
                <p className="text-xs text-gray-400">
                  {waiting
                    ? 'Answering question...'
                    : `Tap a region to color it · ${unlockedCount}/${totalRegions} unlocked`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
