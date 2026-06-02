export type BacentaCategory = {
  label: 'IC' | 'Graduated'
  variant: 'destructive' | 'success'
} | null

export const classifyBacenta = (labels?: string[] | null): BacentaCategory => {
  if (!labels) return null
  if (labels.includes('Red')) {
    return { label: 'IC', variant: 'destructive' }
  }
  if (labels.includes('Green') || labels.includes('Graduated')) {
    return { label: 'Graduated', variant: 'success' }
  }
  return null
}
