/**
 * Converts data arrays to CSV format
 * @param {Array<Array<string>>} dataArrays - Array of data arrays, each containing headers and rows
 * @returns {string} - CSV formatted string
 */
const generateCSV = (...dataArrays) => {
  const csvRows = []

  // Process each data array
  dataArrays.forEach((dataArray, index) => {
    if (!dataArray || dataArray.length === 0) return

    // Add data rows
    dataArray.forEach((row) => {
      // Escape values that contain commas, quotes, or newlines
      const escapedRow = row.map((cell) => {
        const cellStr = String(cell ?? '')
        // If cell contains comma, quote, or newline, wrap in quotes and escape existing quotes
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      })
      csvRows.push(escapedRow.join(','))
    })

    // Add empty row between different data sections (except after the last one)
    if (index < dataArrays.length - 1) {
      csvRows.push('')
    }
  })

  return csvRows.join('\n')
}

// Use CommonJS exports for AWS Lambda compatibility
module.exports = {
  generateCSV,
}
