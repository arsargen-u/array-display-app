import { useState, useMemo } from 'react'
import { STIMULUS_TYPE } from '../../data/directPrograms'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomAngle() { return (Math.random() - 0.5) * 18 }
function randomOffset() { return { x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 20 } }

export function QuestionInterrupt({
  program,
  selectedTargets,
  arraySize,
  messyArray,
  images,
  onComplete,
  onSkip,
  promptConfig,
  consecutiveCorrects = 0,
  trialSets,          // for DISCRIMINATION (doesn't belong / sort) programs
}) {
  // --- Determine target + array items for this trial ---
  const { target, arrayItems } = useMemo(() => {
    // DISCRIMINATION programs with explicit trial sets (e.g. "which doesn't belong")
    if (trialSets && trialSets.length > 0) {
      const set = trialSets[Math.floor(Math.random() * trialSets.length)]
      const t = set.outlier
      const items = shuffle([...set.items, set.outlier])
      return { target: t, arrayItems: items }
    }
    // All other programs
    const t = selectedTargets[Math.floor(Math.random() * selectedTargets.length)]
    const distractors = shuffle(selectedTargets.filter(s => s !== t)).slice(0, arraySize - 1)
    return { target: t, arrayItems: shuffle([t, ...distractors]) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const positions = useMemo(() => arrayItems.map(() => ({
    angle: messyArray ? randomAngle() : 0,
    offset: messyArray ? randomOffset() : { x: 0, y: 0 },
  })), [arrayItems, messyArray]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectivePrompt = useMemo(() => {
    if (!promptConfig || promptConfig.type === 'none') return 'none'
    const thresholds = { fade3: 3, fade5: 5, fade10: 10 }
    const threshold = thresholds[promptConfig.fading]
    if (threshold !== undefined && consecutiveCorrects >= threshold) return 'none'
    return promptConfig.type
  }, [promptConfig, consecutiveCorrects])

  const isTact = program.stimulusType === STIMULUS_TYPE.TACT
  const isReceptive = !isTact

  // Learner can tap to select/deselect freely; therapist scores when ready
  const [selected, setSelected] = useState(null)

  const handleCardTap = (item) => {
    setSelected(prev => prev === item ? null : item)
  }

  const handleScore = (correct) => {
    onComplete({ target, selected, correct, score: correct ? 10 : 0 })
  }

  const handleSkip = () => {
    if (onSkip) onSkip()
    else onComplete({ target, selected: null, correct: false, skipped: true })
  }

  // For TACT: scoring is always available (verbal response, no tap needed)
  const canScore = isTact || selected !== null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">

      {/* Top bar */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg flex-shrink-0">
        {/* Skip / back button */}
        <button
          onClick={handleSkip}
          className="flex-shrink-0 text-indigo-200 hover:text-white text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          ← Skip
        </button>

        {/* SD */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-indigo-200 font-medium uppercase tracking-wide truncate">
            {program.code} · {program.name}
          </p>
          <p className="text-lg font-bold mt-0.5 leading-tight">
            {isReceptive
              ? program.sd.replace('___', `"${target}"`)
              : program.sd}
          </p>
        </div>

        {/* Phase label */}
        <div className="text-right flex-shrink-0">
          {isTact ? (
            <>
              <p className="text-xs text-indigo-200">Learner responds verbally</p>
              <p className="text-sm font-medium">Score below</p>
            </>
          ) : selected ? (
            <>
              <p className="text-xs text-indigo-200">Card selected</p>
              <p className="text-sm font-medium">Score or change</p>
            </>
          ) : (
            <>
              <p className="text-xs text-indigo-200">Learner's turn</p>
              <p className="text-sm font-medium">Tap a picture</p>
            </>
          )}
        </div>
      </div>

      {/* Prompt indicator */}
      {effectivePrompt !== 'none' && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-1.5 flex-shrink-0">
          <span className="text-amber-600 text-xs font-semibold">
            {effectivePrompt === 'positional' ? '↑ Positional prompt active' : '✨ Stimulus prompt active'}
            {promptConfig?.fading !== 'none' && ` · fades after ${
              promptConfig.fading === 'fade3' ? '3' : promptConfig.fading === 'fade5' ? '5' : '10'
            } corrects (${consecutiveCorrects} so far)`}
          </span>
        </div>
      )}

      {/* ── TACT: single stimulus picture ── */}
      {isTact && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <div className="w-64 h-64 rounded-2xl overflow-hidden border-4 border-indigo-200 shadow-xl bg-gray-100 flex items-center justify-center">
            {images[target] ? (
              <img src={images[target]} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-7xl select-none">🖼️</span>
            )}
          </div>
          <p className="text-sm text-gray-400">{program.sd}</p>
        </div>
      )}

      {/* ── RECEPTIVE / MATCH / DISCRIMINATION: picture array ── */}
      {!isTact && (
        <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-2 overflow-auto">
          <div className={`flex flex-wrap items-end justify-center gap-4 ${messyArray ? 'relative' : ''}`}>
            {arrayItems.map((item, idx) => {
              const pos = positions[idx]
              const isSelected = selected === item
              const isTarget = item === target
              const showPositional = isTarget && effectivePrompt === 'positional'
              const showStimulus = isTarget && effectivePrompt === 'stimulus'

              return (
                <button
                  key={idx}
                  onClick={() => handleCardTap(item)}
                  style={{
                    transform: `rotate(${pos.angle}deg) translate(${pos.offset.x}px, ${
                      pos.offset.y + (showPositional ? -16 : 0)
                    }px) ${showPositional ? 'scale(1.06)' : ''}`,
                    transition: 'transform 0.25s ease',
                    zIndex: showPositional ? 10 : 'auto',
                  }}
                  className={`
                    relative flex flex-col items-center gap-2 rounded-2xl p-2 border-4 transition-all duration-150
                    ${isSelected
                      ? 'border-indigo-500 shadow-xl scale-105 bg-indigo-50'
                      : showStimulus
                        ? 'border-amber-400 shadow-lg bg-amber-50 ring-4 ring-amber-300 ring-offset-2'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md active:scale-95'}
                  `}
                >
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm">
                    {images[item] ? (
                      <img src={images[item]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl select-none">🖼️</span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs shadow">✓</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Left: context info */}
          <div className="text-sm text-gray-500 min-w-0">
            {isTact ? (
              <span className="font-medium text-indigo-700">{target}</span>
            ) : (
              <>
                <span className="font-medium">Target:</span>{' '}
                <span className="text-indigo-700 font-semibold">{target}</span>
                {selected && (
                  <>
                    {' · '}
                    <span className="font-medium">Selected:</span>{' '}
                    <span className="font-semibold">{selected}</span>
                  </>
                )}
                {!selected && (
                  <span className="text-gray-400 ml-1">— tap a card</span>
                )}
              </>
            )}
          </div>

          {/* Right: scoring buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleScore(false)}
              disabled={!canScore}
              className="px-5 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base active:scale-95 transition-all shadow"
            >
              ✗ Incorrect
            </button>
            <button
              onClick={() => handleScore(true)}
              disabled={!canScore}
              className="px-5 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base active:scale-95 transition-all shadow"
            >
              ✓ Correct
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
