export const getPercentageChange = (
  avgStat: number,
  avgHigherLevelStat: number
) => {
  const diff = avgStat - avgHigherLevelStat
  if (isNaN(diff)) return '--'
  return Math.round((diff / avgHigherLevelStat) * 100)
}

export const safeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export const computeDelta = (
  church: number | null,
  parent: number | null
): number | null => {
  if (church === null || parent === null || parent === 0) return null
  const raw = getPercentageChange(church, parent)
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

export const formatCount = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  return Number(value).toLocaleString('en-GH', { maximumFractionDigits: 0 })
}

export const formatMoney = (
  value: number | null | undefined,
  currency: string
): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(Number(value))
  }
}
