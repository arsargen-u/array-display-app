import { useState } from 'react'
import { isUnsplashPreConfigured, isPexelsPreConfigured } from '../../config'

function KeyField({ label, storageKey, placeholder, helpText, helpUrl, helpLinkLabel, isPreConfigured }) {
  const [value, setValue] = useState(localStorage.getItem(storageKey) ?? '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (value.trim()) {
      localStorage.setItem(storageKey, value.trim())
    } else {
      localStorage.removeItem(storageKey)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        {isPreConfigured && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            ✓ Pre-configured
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={isPreConfigured ? 'Using clinic key — override here if needed' : placeholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
        />
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
            saved ? 'bg-green-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
          }`}
        >
          {saved ? '✓' : 'Save'}
        </button>
      </div>
      {isPreConfigured ? (
        <p className="text-xs text-green-600 mt-1.5">
          A clinic-wide key is already active. Leave blank to keep using it, or paste your own to override.
        </p>
      ) : helpText && (
        <p className="text-xs text-gray-400 mt-1.5">
          {helpText}{' '}
          {helpUrl && (
            <a href={helpUrl} target="_blank" rel="noreferrer" className="text-indigo-500 underline">
              {helpLinkLabel ?? helpUrl}
            </a>
          )}
        </p>
      )}
    </div>
  )
}

export function SettingsPanel({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900 text-lg">⚙ Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Unsplash */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Unsplash Image Search</h3>
            <KeyField
              label="Access Key"
              storageKey="unsplash_access_key"
              placeholder="Paste Unsplash Access Key…"
              helpText="Free at"
              helpUrl="https://unsplash.com/developers"
              helpLinkLabel="unsplash.com/developers → New Application"
              isPreConfigured={isUnsplashPreConfigured()}
            />
          </div>

          <div className="border-t border-gray-100" />

          {/* Pexels */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Pexels Image Search</h3>
            <KeyField
              label="API Key"
              storageKey="pexels_api_key"
              placeholder="Paste Pexels API Key…"
              helpText="Free at"
              helpUrl="https://www.pexels.com/api/"
              helpLinkLabel="pexels.com/api → Get Started"
              isPreConfigured={isPexelsPreConfigured()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
