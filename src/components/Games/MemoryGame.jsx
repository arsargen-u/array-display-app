import { useState, useCallback } from 'react'

const SYMBOLS = ['🦁','🐯','🐻','🦊','🐼','🦋','🐝','🌸','🌺','🌻','🦄','🍎','🌈','⭐️','🎸']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeCards(pairCount) {
  const syms = SYMBOLS.slice(0, pairCount)
  const deck = []
  syms.forEach((sym, pairId) => {
    deck.push({ id: deck.length, pairId, symbol: sym, revealed: false, matched: false })
    deck.push({ id: deck.length, pairId, symbol: sym, revealed: false, matched: false })
  })
  return shuffle(deck)
}

export function MemoryGame({ onNeedQuestion, difficulty = 'medium' }) {
  const pairCount = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 6 : 4

  const [cards, setCards] = useState(() => makeCards(pairCount))
  const [flipped, setFlipped] = useState([])   // max 1 card waiting for a pair
  const [checking, setChecking] = useState(false)
  const [score, setScore] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  const reset = () => {
    setCards(makeCards(pairCount))
    setFlipped([])
    setChecking(false)
    setScore(0)
    setGameWon(false)
  }

  const handleCardClick = useCallback((cardId) => {
    if (checking) return

    // Read from current state — these closures are fresh on every render
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (!card || card.matched || card.revealed) return prev
      return prev.map(c => c.id === cardId ? { ...c, revealed: true } : c)
    })

    // Use a functional update to read latest flipped
    setFlipped(prevFlipped => {
      // Prevent double-tap
      if (prevFlipped.includes(cardId)) return prevFlipped

      // Find current card data (stable, won't change)
      // We access cards via closure but pairId is immutable per card
      const allCards = cards  // snapshot — pairId never changes
      const card = allCards.find(c => c.id === cardId)
      if (!card || card.matched || card.revealed) return prevFlipped

      if (prevFlipped.length === 0) {
        return [cardId]
      }

      // Second card flipped — check for match
      const firstId = prevFlipped[0]
      const firstCard = allCards.find(c => c.id === firstId)

      if (firstCard && firstCard.pairId === card.pairId && firstId !== cardId) {
        // ✅ Match — trigger DTT
        setChecking(true)
        onNeedQuestion((result) => {
          if (result?.correct) {
            setCards(c => {
              const updated = c.map(x => x.pairId === card.pairId
                ? { ...x, matched: true, revealed: true }
                : x)
              if (updated.every(x => x.matched)) setGameWon(true)
              return updated
            })
            setScore(s => s + 1)
          } else {
            // Flip both back
            setCards(c => c.map(x =>
              (x.id === firstId || x.id === cardId) ? { ...x, revealed: false } : x
            ))
          }
          setFlipped([])
          setChecking(false)
        })
      } else {
        // ❌ No match — flip back after short delay
        setChecking(true)
        setTimeout(() => {
          setCards(c => c.map(x =>
            (x.id === firstId || x.id === cardId) ? { ...x, revealed: false } : x
          ))
          setFlipped([])
          setChecking(false)
        }, 900)
      }

      return [firstId, cardId]
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, checking, onNeedQuestion])

  const cols = pairCount <= 3 ? 3 : 4

  return (
    <div className="flex flex-col h-full bg-purple-50 select-none">
      {/* Header */}
      <div className="bg-purple-600 text-white px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🃏</span>
          <span className="font-bold text-lg">Memory Match</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-purple-200">
            {score}/{pairCount} matched
          </span>
          <button
            onClick={reset}
            className="text-xs text-purple-200 hover:text-white underline"
          >
            New game
          </button>
        </div>
      </div>

      {gameWon ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="text-8xl animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-purple-700">All pairs matched!</h2>
          <p className="text-gray-500 text-center">You found all {pairCount} pairs!</p>
          <button
            onClick={reset}
            className="px-10 py-3 bg-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-purple-700 active:scale-95 transition-all"
          >
            Play Again 🎴
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={checking || card.matched}
                className={`
                  w-20 h-20 sm:w-24 sm:h-24 rounded-2xl text-4xl font-bold
                  flex items-center justify-center shadow-md
                  transition-all duration-200 focus:outline-none
                  ${card.matched
                    ? 'bg-green-100 border-4 border-green-400 scale-95 cursor-default'
                    : card.revealed
                      ? 'bg-white border-4 border-purple-400 scale-105'
                      : 'bg-purple-500 hover:bg-purple-400 active:scale-95 cursor-pointer border-4 border-purple-600'}
                `}
              >
                {(card.revealed || card.matched)
                  ? <span className={card.matched ? 'opacity-60' : ''}>{card.symbol}</span>
                  : <span className="text-purple-300 text-2xl">?</span>
                }
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hint footer */}
      {!gameWon && (
        <div className="border-t border-purple-100 py-2 bg-white/60 text-center flex-shrink-0">
          <p className="text-xs text-gray-400">
            {checking ? 'Checking...' : 'Tap two cards to find a matching pair'}
          </p>
        </div>
      )}
    </div>
  )
}
