export const getPercentageChange = (
  avgStat: number,
  avgHigherLevelStat: number
) => {
  const diff = avgStat - avgHigherLevelStat
  if (isNaN(diff)) return '--'
  return Math.round((diff / avgHigherLevelStat) * 100)
}
