import { useState } from 'react'

function KeyField({ label, storageKey, placeholder, helpText, helpUrl, helpLinkLabel }) {
  const [value, setValue] = useState(localStorage.getItem(storageKey) ?? '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem(storageKey, value.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
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
      {helpText && (
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
            />
          </div>

          <div className="border-t border-gray-100" />

          {/* Google */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Google Image Search</h3>
            <div className="space-y-3">
              <KeyField
                label="API Key"
                storageKey="google_api_key"
                placeholder="Paste Google API Key…"
                helpText="Create at"
                helpUrl="https://console.cloud.google.com/apis/credentials"
                helpLinkLabel="Google Cloud Console"
              />
              <KeyField
                label="Search Engine ID (cx)"
                storageKey="google_cx"
                placeholder="e.g. 017576662512468239146:omuauf_lfve"
                helpText="Create at"
                helpUrl="https://programmablesearchengine.google.com/"
                helpLinkLabel="programmablesearchengine.google.com"
              />
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700 space-y-1">
              <p className="font-semibold">Google setup (3 steps):</p>
              <ol className="list-decimal list-inside space-y-0.5 text-amber-600">
                <li>Enable <strong>Custom Search JSON API</strong> in Cloud Console</li>
                <li>Create an API Key under Credentials</li>
                <li>Create a Search Engine → enable <em>Image search</em> + <em>Search the entire web</em></li>
              </ol>
              <p className="text-amber-500">Free tier: 100 searches/day</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
