/**
 * Lightweight device fingerprint generator.
 * Uses FingerprintJS (open-source) for a stable browser-level identifier.
 * Falls back to a canvas-based hash if the library is unavailable.
 */

let cachedFingerprint: string | null = null

/**
 * Get a stable device fingerprint for the current browser.
 * Caches the result for the page session.
 */
export const getDeviceFingerprint = async (): Promise<string> => {
  if (cachedFingerprint) return cachedFingerprint

  try {
    // Try FingerprintJS (must be installed: npm i @fingerprintjs/fingerprintjs)
    // @ts-ignore - optional dependency
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    cachedFingerprint = result.visitorId
    return cachedFingerprint as string
  } catch {
    // Fallback: canvas + user-agent hash
    cachedFingerprint = await fallbackFingerprint()
    return cachedFingerprint
  }
}

/**
 * Fallback fingerprint using canvas rendering + navigator props.
 */
const fallbackFingerprint = async (): Promise<string> => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('FLC-checkin-fp', 2, 15)
  }
  const canvasData = canvas.toDataURL()

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasData,
  ].join('|')

  // Simple hash (djb2)
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i)
  }
  return `fb-${(hash >>> 0).toString(36)}`
}
