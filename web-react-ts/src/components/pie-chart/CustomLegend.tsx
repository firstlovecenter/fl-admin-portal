'use client'

import { PIE_CHART_COLORS } from 'global-utils'
import React from 'react'
import './PieChart.css'

type CustomLegendProps = {
  name: string
  value: number
  percentage: number
}

type Props = {
  data: CustomLegendProps[]
}

const CustomLegend = ({ data }: Props) => {
  return (
    <div className="custom-legend">
      {data?.map((entry, index) => (
        <div>
          <div
            key={`legend-item-${index}`}
            className="d-flex justify-content-between"
          >
            <div className="d-flex align-items-center">
              <div
                className="circle-bullet"
                style={{
                  background: PIE_CHART_COLORS[index],
                }}
              ></div>
              <div>
                <h6 className="legend-text">{entry?.name}</h6>
                <h6 className="text-secondary legend-text">{entry?.value}</h6>
              </div>
            </div>

            <div className="d-flex align-items-center">
              <h1
                className="badge bg-dark badge-pill legend-text"
                style={{ color: PIE_CHART_COLORS[index] }}
              >
                {entry.percentage}%
              </h1>
            </div>
          </div>
          <hr className="legend-hr" />
        </div>
      ))}
    </div>
  )
}

export default CustomLegend
