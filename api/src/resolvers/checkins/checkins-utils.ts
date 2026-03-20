import crypto from 'crypto'
import { CheckInScopeLevel } from './checkins-types'
import { Context } from '../utils/neo4j-types'
import { ChurchLevel } from '../utils/types'

export const scopeLabelMap: Record<CheckInScopeLevel, ChurchLevel> = {
  OVERSIGHT: 'Oversight',
  CAMPUS: 'Campus',
  STREAM: 'Stream',
  COUNCIL: 'Council',
  GOVERNORSHIP: 'Governorship',
  BACENTA: 'Bacenta',
}

export const scopeDepthMap: Record<CheckInScopeLevel, number> = {
  OVERSIGHT: 5,
  CAMPUS: 4,
  STREAM: 3,
  COUNCIL: 2,
  GOVERNORSHIP: 1,
  BACENTA: 0,
}

export const resolveAuthId = (context: Context): string => {
  const sub = context.jwt?.sub || ''
  return sub.replace('auth0|', '')
}

export const generatePinCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const generateQrSecret = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const getTimeBucket = (
  rotationSeconds: number,
  date: Date = new Date()
): number => {
  const time = date.getTime()
  return Math.floor(time / (rotationSeconds * 1000))
}

export const generateQrToken = (
  eventId: string,
  qrSecret: string,
  rotationSeconds: number,
  bucket?: number
): string => {
  const timeBucket = bucket ?? getTimeBucket(rotationSeconds)
  const payload = `${eventId}:${timeBucket}`
  const hmac = crypto.createHmac('sha256', qrSecret)
  hmac.update(payload)
  return hmac.digest('base64url')
}

export const validateQrToken = (
  eventId: string,
  qrSecret: string,
  rotationSeconds: number,
  token: string
): boolean => {
  const currentBucket = getTimeBucket(rotationSeconds)
  const validBuckets = [currentBucket, currentBucket - 1]
  return validBuckets.some(
    (bucket) =>
      generateQrToken(eventId, qrSecret, rotationSeconds, bucket) === token
  )
}

export const calculateIsLate = (
  startsAt: string,
  gracePeriod: number
): boolean => {
  const start = new Date(startsAt).getTime()
  const now = Date.now()
  const graceMs = gracePeriod * 60 * 1000
  return now > start + graceMs
}

export const isWithinEventWindow = (
  startsAt: string,
  endsAt: string
): boolean => {
  const now = Date.now()
  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()
  return now >= start && now <= end
}

export const getScopeLabel = (scopeLevel: CheckInScopeLevel): ChurchLevel => {
  return scopeLabelMap[scopeLevel]
}

export const getScopeDepth = (scopeLevel: CheckInScopeLevel): number => {
  return scopeDepthMap[scopeLevel]
}
