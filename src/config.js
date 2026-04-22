// Clinic-wide API keys baked into the build.
// Override per-device via ⚙ Settings, or set VITE_UNSPLASH_KEY /
// VITE_PEXELS_KEY as Render environment variables at build time.

const BUILT_IN_UNSPLASH = '_UeY3RUaQCfABlhNe8cbaLAfSZ-5R1TDFLWXoQtCyjY'
const BUILT_IN_PEXELS   = 'iBIIc34O14733GmxRBhXB4Y4OGYckgCrsCiI7tEyafqQeXp2t6OW8lnE'

export function getUnsplashKey() {
  return localStorage.getItem('unsplash_access_key')
    || import.meta.env.VITE_UNSPLASH_KEY
    || BUILT_IN_UNSPLASH
}

export function getPexelsKey() {
  return localStorage.getItem('pexels_api_key')
    || import.meta.env.VITE_PEXELS_KEY
    || BUILT_IN_PEXELS
}

export function isUnsplashPreConfigured() {
  return !localStorage.getItem('unsplash_access_key') && !!(import.meta.env.VITE_UNSPLASH_KEY || BUILT_IN_UNSPLASH)
}

export function isPexelsPreConfigured() {
  return !localStorage.getItem('pexels_api_key') && !!(import.meta.env.VITE_PEXELS_KEY || BUILT_IN_PEXELS)
}
