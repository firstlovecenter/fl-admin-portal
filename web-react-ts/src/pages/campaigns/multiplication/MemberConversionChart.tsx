import CustomLabel from 'components/pie-chart/CustomLabel'
import CustomLegend from 'components/pie-chart/CustomLegend'
import { PIE_CHART_COLORS } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import React from 'react'
import { Pie, Cell, Legend, Tooltip, PieChart, Label } from 'recharts'

export interface ConversionItem {
  howYouJoined: string | null
  number: number
  percentage: number
}

export interface MemberConversionDataProps {
  aggregateMemberConversion: ConversionItem[]
}

const MemberConversionChart = (data: MemberConversionDataProps) => {
  const createConversionArray = () => {
    return data?.aggregateMemberConversion?.map((item) => ({
      name: item.howYouJoined || 'Unknown',
      value: item.number,
      percentage: item.percentage,
    }))
  }

  const aggregateMemberConversionData = createConversionArray()

  const total = aggregateMemberConversionData?.reduce(
    (sum, item) => sum + item.value,
    0
  )

  return aggregateMemberConversionData.length === 0 ? (
    <NoDataComponent text="No Member Conversion Data for your church" />
  ) : (
    <div className="d-flex justify-content-center">
      <PieChart width={window.innerWidth} height={580}>
        <Pie
          data={aggregateMemberConversionData}
          innerRadius="70%"
          outerRadius="80%"
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {aggregateMemberConversionData?.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
            />
          ))}
          <Label
            content={<CustomLabel label="Members" total={total} />}
            position="center"
          />
        </Pie>
        <Legend
          content={<CustomLegend data={aggregateMemberConversionData} />}
        />
        <Tooltip />
      </PieChart>
    </div>
  )
}

export default MemberConversionChart
