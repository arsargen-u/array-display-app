import { useState, useEffect, useCallback } from 'react'
import { getAllLibraryImages, searchLibraryImages } from '../../store/db'
import { compressImage } from '../../utils/imageUtils'
import { getUnsplashKey, getPexelsKey } from '../../config'
import PictureLibrary from './PictureLibrary'

// --- helpers ---
async function urlToBase64(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  const raw = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return compressImage(raw)
}

// --- Library tab ---
function LibraryTab({ onSelect }) {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (q) => {
    setLoading(true)
    try {
      const results = q.trim() ? await searchLibraryImages(q) : await getAllLibraryImages()
      setImages(results)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load('') }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(query), 300)
    return () => clearTimeout(t)
  }, [query, load])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading library…</div>
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 py-2 border-b border-gray-100">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search library by label…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {images.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-gray-400 text-sm">No images in library yet.</p>
            <p className="text-gray-300 text-xs">Go to 🖼 Image Library in the nav to add some.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <button
                key={img.id}
                onClick={() => onSelect(img.imageData)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden border-2 border-transparent group-hover:border-indigo-400 transition-all active:scale-95">
                  <img src={img.imageData} alt={img.label} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-gray-500 truncate w-full text-center px-1">{img.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Unsplash tab ---
function UnsplashTab({ targetName, onSelect }) {
  const [query, setQuery] = useState(targetName ?? '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = async () => {
    const apiKey = getUnsplashKey()
    if (!apiKey) { setError('No Unsplash key set — add one in ⚙ Settings.'); return }
    if (!query.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=squarish`,
        { headers: { Authorization: `Client-ID ${apiKey}` } }
      )
      if (!res.ok) throw new Error(`Unsplash error ${res.status}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleSelect = async (photo) => {
    try { onSelect(await urlToBase64(photo.urls.small)) }
    catch { onSelect(photo.urls.small) }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search Unsplash…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        <button
          onClick={search}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Go'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 px-4 py-2">{error}</p>}
      <div className="flex-1 overflow-y-auto p-3">
        {results.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {getUnsplashKey() ? 'Search for photos above' : 'Add an Unsplash API key in ⚙ Settings'}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {results.map(photo => (
              <button key={photo.id} onClick={() => handleSelect(photo)}
                className="aspect-square rounded-xl overflow-hidden hover:ring-4 hover:ring-indigo-400 transition-all active:scale-95">
                <img src={photo.urls.thumb} alt={photo.alt_description ?? ''} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-center text-xs text-gray-300 py-1.5 border-t border-gray-100 flex-shrink-0">
        Photos from <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline">Unsplash</a>
      </p>
    </div>
  )
}

// --- Pexels tab ---
function PexelsTab({ targetName, onSelect }) {
  const [query, setQuery] = useState(targetName ?? '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = async () => {
    const apiKey = getPexelsKey()
    if (!apiKey) { setError('No Pexels key set — add one in ⚙ Settings.'); return }
    if (!query.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=square`,
        { headers: { Authorization: apiKey } }
      )
      if (!res.ok) throw new Error(`Pexels error ${res.status}`)
      const data = await res.json()
      setResults(data.photos ?? [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleSelect = async (photo) => {
    try { onSelect(await urlToBase64(photo.src.medium)) }
    catch { onSelect(photo.src.medium) }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search Pexels…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        <button
          onClick={search}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? '…' : 'Go'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 px-4 py-2">{error}</p>}
      <div className="flex-1 overflow-y-auto p-3">
        {results.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {getPexelsKey() ? 'Search for photos above' : 'Add a Pexels API key in ⚙ Settings'}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {results.map(photo => (
              <button key={photo.id} onClick={() => handleSelect(photo)}
                className="aspect-square rounded-xl overflow-hidden hover:ring-4 hover:ring-emerald-400 transition-all active:scale-95 bg-gray-100">
                <img
                  src={photo.src.tiny}
                  alt={photo.alt ?? ''}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-center text-xs text-gray-300 py-1.5 border-t border-gray-100 flex-shrink-0">
        Photos from <a href="https://www.pexels.com" target="_blank" rel="noreferrer" className="underline">Pexels</a>
      </p>
    </div>
  )
}

// --- Built-in Picture Library helpers ---
async function fetchWikiThumbUrl(term) {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`)
    if (r.ok) {
      const d = await r.json()
      if (d.thumbnail?.source) return d.thumbnail.source
    }
  } catch {}
  // OpenSearch fallback — resolves descriptive phrases to canonical article titles
  try {
    const r = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=1&format=json&origin=*`
    )
    const [, titles] = await r.json()
    const title = titles?.[0]
    if (title) {
      const r2 = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
      if (r2.ok) {
        const d = await r2.json()
        if (d.thumbnail?.source) return d.thumbnail.source
      }
    }
  } catch {}
  return null
}

function variantToSVGDataURL(variant) {
  const size = 200, coral = '#D9674A', coralBg = '#FBF0ED', greenBg = '#EFF6EA'
  const cx = size / 2, cy = size / 2, s = size

  if (variant.type === 'shape') {
    const color = variant.color
    const poly = (n, r, off = -90) => Array.from({ length: n }, (_, i) => {
      const a = (off + i * 360 / n) * Math.PI / 180
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
    }).join(' ')
    const star = () => Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? s * 0.42 : s * 0.18, a = (-90 + i * 36) * Math.PI / 180
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
    }).join(' ')
    const heart = `M${cx} ${s*.8} C${s*.2} ${s*.6},${s*.05} ${s*.45},${s*.05} ${s*.3} C${s*.05} ${s*.15},${s*.15} ${s*.08},${s*.28} ${s*.08} C${s*.36} ${s*.08},${s*.43} ${s*.12},${cx} ${s*.2} C${s*.57} ${s*.12},${s*.64} ${s*.08},${s*.72} ${s*.08} C${s*.85} ${s*.08},${s*.95} ${s*.15},${s*.95} ${s*.3} C${s*.95} ${s*.45},${s*.8} ${s*.6},${cx} ${s*.8} Z`
    const inner = ({
      circle:    `<circle cx="${cx}" cy="${cy}" r="${s*.41}" fill="${color}"/>`,
      square:    `<rect x="${s*.1}" y="${s*.1}" width="${s*.8}" height="${s*.8}" fill="${color}"/>`,
      triangle:  `<polygon points="${cx},${s*.08} ${s*.92},${s*.88} ${s*.08},${s*.88}" fill="${color}"/>`,
      rectangle: `<rect x="${s*.06}" y="${s*.24}" width="${s*.88}" height="${s*.52}" fill="${color}"/>`,
      oval:      `<ellipse cx="${cx}" cy="${cy}" rx="${s*.43}" ry="${s*.27}" fill="${color}"/>`,
      diamond:   `<polygon points="${cx},${s*.07} ${s*.93},${cy} ${cx},${s*.93} ${s*.07},${cy}" fill="${color}"/>`,
      star:      `<polygon points="${star()}" fill="${color}"/>`,
      heart:     `<path d="${heart}" fill="${color}"/>`,
      pentagon:  `<polygon points="${poly(5, s*.42)}" fill="${color}"/>`,
      hexagon:   `<polygon points="${poly(6, s*.42)}" fill="${color}"/>`,
    })[variant.shape] || ''
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${inner}</svg>`
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  }

  if (variant.type === 'number') {
    const v = variant.value, st = variant.style
    let inner = ''
    if (st === 'numeral') {
      inner = `<text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" font-size="${s*.58}" font-weight="900" fill="${coral}" font-family="Arial,sans-serif">${v}</text>`
    } else if (st === 'word') {
      const words = ['','one','two','three','four','five','six','seven','eight','nine','ten']
      inner = `<text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" font-size="${s*.2}" font-weight="800" fill="${coral}" font-family="Arial,sans-serif">${(words[v]||v).toUpperCase()}</text>`
    } else if (st === 'dots') {
      const count = Math.min(v, 10)
      const cols = v <= 4 ? v : 3
      const rows = Math.ceil(count / cols)
      const r = s * 0.08, pad = s * 0.15
      const gapX = cols > 1 ? (s - 2*pad - 2*r) / (cols - 1) : 0
      const gapY = rows > 1 ? (s - 2*pad - 2*r) / (rows - 1) : 0
      const startX = cols === 1 ? cx : pad + r
      const startY = rows === 1 ? cy : pad + r
      for (let i = 0; i < count; i++) {
        const col = i % cols, row = Math.floor(i / cols)
        inner += `<circle cx="${startX + col*gapX}" cy="${startY + row*gapY}" r="${r}" fill="${coral}"/>`
      }
    } else if (st === 'tally') {
      const groups = Math.floor(v / 5), rem = v % 5
      const bH = s * 0.28, bW = 4, gap = 6
      const groupW = 4 * (bW + gap) + bH + gap
      const total = groups + (rem > 0 ? 1 : 0)
      const startX = cx - total * (groupW + 8) / 2
      const startY = cy - bH / 2
      for (let g = 0; g < groups; g++) {
        const gx = startX + g * (groupW + 8)
        for (let i = 0; i < 4; i++) inner += `<rect x="${gx + i*(bW+gap)}" y="${startY}" width="${bW}" height="${bH}" fill="${coral}" rx="2"/>`
        inner += `<line x1="${gx - 4}" y1="${startY + bH - 4}" x2="${gx + groupW - 8}" y2="${startY + 4}" stroke="${coral}" stroke-width="3" stroke-linecap="round"/>`
      }
      if (rem > 0) {
        const gx = startX + groups * (groupW + 8)
        for (let i = 0; i < rem; i++) inner += `<rect x="${gx + i*(bW+gap)}" y="${startY}" width="${bW}" height="${bH}" fill="${coral}" rx="2"/>`
      }
    } else if (st === 'dice' && v <= 6) {
      const pips = {1:[[50,50]],2:[[28,28],[72,72]],3:[[25,25],[50,50],[75,75]],4:[[28,28],[28,72],[72,28],[72,72]],5:[[25,25],[25,75],[50,50],[75,25],[75,75]],6:[[25,25],[25,75],[50,25],[50,75],[75,25],[75,75]]}
      inner = `<rect width="${size}" height="${size}" fill="white" rx="16" stroke="#E5E7EB" stroke-width="3"/>`
      for (const [t,l] of (pips[v]||[])) inner += `<circle cx="${s*l/100}" cy="${s*t/100}" r="${s*.08}" fill="${coral}"/>`
    } else {
      inner = `<text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" font-size="${s*.58}" font-weight="900" fill="${coral}" font-family="Arial,sans-serif">${v}</text>`
    }
    const bg = st === 'dice' ? '' : `<rect width="${size}" height="${size}" fill="${coralBg}" rx="8"/>`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${bg}${inner}</svg>`
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  }

  if (variant.type === 'letter') {
    const letter = variant.case === 'lower' ? variant.value.toLowerCase() : variant.value.toUpperCase()
    const color = variant.color || coral
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${greenBg}" rx="8"/><text x="${cx}" y="${cy}" dominant-baseline="central" text-anchor="middle" font-size="${s*.62}" font-weight="900" fill="${color}" font-family="Arial,sans-serif">${letter}</text></svg>`
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  }

  return null
}

async function variantToDataURL(variant) {
  // SVG-rendered types — instant, no network
  if (variant.type === 'shape' || variant.type === 'number' || variant.type === 'letter') {
    return variantToSVGDataURL(variant)
  }
  // Generalization — Wikimedia Commons direct URL
  if (variant.type === 'generalization') {
    try { return await urlToBase64(variant.src) } catch {}
    return null
  }
  // Wikipedia-sourced types
  if (variant.type === 'wiki' || variant.type === 'color') {
    const thumbUrl = await fetchWikiThumbUrl(variant.term)
    if (thumbUrl) {
      try { return await urlToBase64(thumbUrl) } catch {}
    }
    return null
  }
  return null
}

// --- Built-in tab ---
function BuiltInTab({ targetName, onSelect }) {
  const [loading, setLoading] = useState(false)

  const handleVariantSelect = async (variant) => {
    setLoading(true)
    try {
      const dataUrl = await variantToDataURL(variant)
      if (dataUrl) onSelect(dataUrl)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
          <div className="text-sm text-gray-500 font-medium">Fetching image…</div>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PictureLibrary
          onSelect={handleVariantSelect}
          showGeneralization={true}
          height="100%"
          initialCategory={targetName ? 'animals' : 'shapes'}
        />
      </div>
    </div>
  )
}

// --- Main picker ---
const TABS = [
  { id: 'library',  label: '📚 Library' },
  { id: 'builtin',  label: '🎨 Built-in' },
  { id: 'unsplash', label: '🔍 Unsplash' },
  { id: 'pexels',   label: '🌿 Pexels' },
]

export function ImagePicker({ targetName, onSelect, onClose, defaultTab = 'library' }) {
  const [tab, setTab] = useState(defaultTab)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ height: '85vh' }}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Add Image</h3>
            {targetName && <p className="text-xs text-gray-400">for "{targetName}"</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {tab === 'library'  && <LibraryTab  onSelect={onSelect} />}
          {tab === 'builtin'  && <BuiltInTab  targetName={targetName} onSelect={onSelect} />}
          {tab === 'unsplash' && <UnsplashTab targetName={targetName} onSelect={onSelect} />}
          {tab === 'pexels'   && <PexelsTab   targetName={targetName} onSelect={onSelect} />}
        </div>
      </div>
    </div>
  )
}
