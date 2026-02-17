/**
 * Client-side face comparison using face-api.js
 *
 * This service loads face-api models on demand and compares two face images.
 * It runs entirely in the browser — zero API cost.
 *
 * When face-api.js is not installed or models fail to load,
 * the service gracefully degrades and returns SKIPPED status.
 */

export type FaceMatchResult = {
  status: 'VERIFIED' | 'FLAGGED' | 'SKIPPED'
  score: number | null
  error?: string
}

const FACE_MATCH_THRESHOLD = 0.5 // euclidean distance threshold (lower = stricter)
let modelsLoaded = false
let faceapi: any = null

/**
 * Lazily load face-api.js and its models.
 * Models are loaded from a CDN to avoid bundling ~6MB.
 */
const ensureModels = async (): Promise<boolean> => {
  if (modelsLoaded && faceapi) return true

  try {
    // @ts-ignore - optional dependency
    faceapi = await import('face-api.js')

    // Load models from jsdelivr CDN
    const MODEL_URL =
      'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights'

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])

    modelsLoaded = true
    return true
  } catch (err) {
    console.warn('face-api.js not available, face match will be skipped:', err)
    return false
  }
}

/**
 * Create an HTMLImageElement from a base64 data URL or http URL.
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

/**
 * Compare two face images and return a match result.
 *
 * @param selfieDataUrl  - The just-captured selfie (base64 data URL)
 * @param referenceUrl   - The member's profile picture URL (or base64)
 * @returns FaceMatchResult
 */
export const compareFaces = async (
  selfieDataUrl: string,
  referenceUrl: string
): Promise<FaceMatchResult> => {
  // If no reference photo, skip matching
  if (!referenceUrl) {
    return { status: 'SKIPPED', score: null, error: 'No reference photo' }
  }

  const ready = await ensureModels()
  if (!ready) {
    return {
      status: 'SKIPPED',
      score: null,
      error: 'Face detection models not available',
    }
  }

  try {
    const [selfieImg, referenceImg] = await Promise.all([
      loadImage(selfieDataUrl),
      loadImage(referenceUrl),
    ])

    const selfieDetection = await faceapi
      .detectSingleFace(selfieImg)
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!selfieDetection) {
      return { status: 'FLAGGED', score: 0, error: 'No face detected in selfie' }
    }

    const referenceDetection = await faceapi
      .detectSingleFace(referenceImg)
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!referenceDetection) {
      return {
        status: 'SKIPPED',
        score: null,
        error: 'No face detected in reference photo',
      }
    }

    // Euclidean distance between face descriptors (lower = more similar)
    const distance = faceapi.euclideanDistance(
      selfieDetection.descriptor,
      referenceDetection.descriptor
    )

    // Convert distance to a similarity score (0–1)
    const score = Math.max(0, 1 - distance)

    return {
      status: distance <= FACE_MATCH_THRESHOLD ? 'VERIFIED' : 'FLAGGED',
      score,
    }
  } catch (err: any) {
    console.error('Face comparison error:', err)
    return {
      status: 'FLAGGED',
      score: null,
      error: err?.message || 'Face comparison failed',
    }
  }
}
