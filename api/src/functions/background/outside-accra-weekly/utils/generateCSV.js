/**
 * Converts data arrays to CSV format - merges all arrays horizontally
 * @param {Array<Array<string>>} dataArrays - Array of data arrays, each containing headers and rows
 * @returns {string} - CSV formatted string
 */
const generateCSV = (...dataArrays) => {
  if (!dataArrays || dataArrays.length === 0) return ''

  // Extract headers from each array and combine them
  const headers = []
  dataArrays.forEach((dataArray) => {
    if (dataArray && dataArray.length > 0) {
      // Add all columns from the header row except the first array's headers
      // (to avoid duplicating campus info)
      if (headers.length === 0) {
        headers.push(...dataArray[0])
      } else {
        headers.push(...dataArray[0])
      }
    }
  })

  const csvRows = []

  // Add combined header row
  const escapedHeaders = headers.map((cell) => {
    const cellStr = String(cell ?? '')
    if (
      cellStr.includes(',') ||
      cellStr.includes('"') ||
      cellStr.includes('\n')
    ) {
      return `"${cellStr.replace(/"/g, '""')}"`
    }
    return cellStr
  })
  csvRows.push(escapedHeaders.join(','))

  // Get the maximum number of data rows
  const maxRows = Math.max(
    ...dataArrays.map((arr) => (arr ? arr.length - 1 : 0))
  )

  // Combine rows from all arrays
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    const combinedRow = []

    dataArrays.forEach((dataArray, arrayIndex) => {
      if (dataArray && dataArray.length > rowIndex + 1) {
        // rowIndex + 1 because row 0 is headers
        const dataRow = dataArray[rowIndex + 1]
        if (arrayIndex === 0) {
          // For the first array, include all columns
          combinedRow.push(...dataRow)
        } else {
          // For subsequent arrays, include all columns (no need to skip campus info)
          combinedRow.push(...dataRow)
        }
      } else {
        // If this array doesn't have this row, add empty cells
        if (dataArray && dataArray.length > 0) {
          const colCount = dataArray[0].length
          combinedRow.push(...Array(colCount).fill(''))
        }
      }
    })

    // Escape values in the combined row
    const escapedRow = combinedRow.map((cell) => {
      const cellStr = String(cell ?? '')
      if (
        cellStr.includes(',') ||
        cellStr.includes('"') ||
        cellStr.includes('\n')
      ) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    })

    csvRows.push(escapedRow.join(','))
  }

  return csvRows.join('\n')
}

// Use CommonJS exports for AWS Lambda compatibility
module.exports = {
  generateCSV,
}
