import { useState, useEffect, useRef } from 'react'
import {
  getAllLibraryImages,
  searchLibraryImages,
  addLibraryImage,
  updateLibraryImage,
  deleteLibraryImage,
} from '../../store/db'

export function LibraryManager() {
  const [images, setImages] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const fileInputRef = useRef(null)

  const reload = async (q = query) => {
    setLoading(true)
    try {
      const results = q.trim() ? await searchLibraryImages(q) : await getAllLibraryImages()
      setImages(results)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload('') }, [])

  useEffect(() => {
    const t = setTimeout(() => reload(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    for (const file of files) {
      const label = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      const imageData = await new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = ev => resolve(ev.target.result)
        reader.readAsDataURL(file)
      })
      await addLibraryImage({ label, imageData, source: 'upload' })
    }
    e.target.value = ''
    reload('')
    setQuery('')
  }

  const handleSaveEdit = async (id) => {
    await updateLibraryImage(id, { label: editLabel.trim(), category: editCategory.trim() })
    setEditingId(null)
    reload()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this image from the library?')) return
    await deleteLibraryImage(id)
    reload()
  }

  const startEdit = (img) => {
    setEditingId(img.id)
    setEditLabel(img.label)
    setEditCategory(img.category ?? '')
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex gap-3 items-center flex-shrink-0">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by label or category…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors active:scale-95 flex-shrink-0"
        >
          ↑ Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Stats */}
      <div className="px-5 py-2 flex-shrink-0">
        <p className="text-xs text-gray-400">
          {images.length} image{images.length !== 1 ? 's' : ''} in library
          {query && ` matching "${query}"`}
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : images.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-5xl">🖼️</p>
            <p className="text-gray-500 font-medium">
              {query ? 'No images match that search' : 'Your library is empty'}
            </p>
            <p className="text-gray-400 text-sm">
              {query ? 'Try a different search term' : 'Tap ↑ Upload to add images'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(img => (
              <div key={img.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img src={img.imageData} alt={img.label} className="w-full h-full object-cover" />
                </div>

                {/* Info / edit */}
                {editingId === img.id ? (
                  <div className="p-3 space-y-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      placeholder="Label"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(img.id)}
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      placeholder="Category (optional)"
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(img.id)}
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSaveEdit(img.id)}
                        className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 truncate">{img.label || '(no label)'}</p>
                    {img.category && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{img.category}</p>
                    )}
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => startEdit(img)}
                        className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        ✏ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(img.id)}
                        className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
