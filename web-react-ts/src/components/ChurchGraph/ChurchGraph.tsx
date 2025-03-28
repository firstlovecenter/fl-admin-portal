import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { ChurchLevelLower } from 'global-types'
import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router'
import { Container } from 'react-bootstrap'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
  Legend,
} from 'recharts'
import { capitalise } from '../../global-utils'
import './ChurchGraph.css'
import { ScaleLoader } from 'react-spinners'
import { GraphTypes } from 'pages/services/graphs/graphs-utils'

type ChurchGraphProps = {
  loading?: boolean
  stat1: 'attendance' | 'income'
  stat2: 'attendance' | 'income' | 'target' | null
  churchData: any[]
  secondaryTitle?: string
  graphType: GraphTypes
  income: boolean
  church: ChurchLevelLower | string
  swollenSunday?: boolean
}

const ChurchGraph = (props: ChurchGraphProps) => {
  const {
    loading,
    stat1,
    stat2,
    churchData,
    secondaryTitle,
    income,
    graphType,
  } = props
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const [sortedData, setSortedData] = useState<any[]>([])
  const [dataMax, setDataMax] = useState<{
    attendance: number
    income: number
    target: number
  }>({ attendance: 0, income: 0, target: 0 })

  useEffect(() => {
    setSortedData(churchData.reverse())

    setDataMax({
      attendance:
        Math.max.apply(
          Math,
          churchData?.map((max: any) => {
            return max.attendance
          })
        ) * 1.2,
      income:
        Math.max.apply(
          Math,
          churchData?.map((max: any) => {
            return max.income
          })
        ) + 1.2,
      target:
        Math.max.apply(
          Math,
          churchData?.map((max: any) => {
            return max.target
          })
        ) + 1.2,
    })
  }, [churchData])

  type CustomToolTipProps = {
    payload?: any
    label?: string
    active?: boolean
  }
  const CustomTooltip = ({ active, payload, label }: CustomToolTipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip p-2">
          <p className="label">{`Week ${label}`}</p>
          <p className="intro">{`${payload[0].name}: ${payload[0].value}`}</p>
          {!!payload[1] && (
            <p className="intro">{`${payload[1].name}: ${payload[1].value}`}</p>
          )}

          {!!payload[0] && !!payload[0].payload.numberOfServices && (
            <p className="intro">{`Number of Services: ${payload[0].payload.numberOfServices}`}</p>
          )}

          {!!payload[0] && !!payload[0].payload.numberOfUrvans && (
            <p className="intro">{`Number of Urvans: ${payload[0].payload.numberOfUrvans}`}</p>
          )}
          {!!payload[0] && !!payload[0].payload.numberOfSprinters && (
            <p className="intro">{`Number of Sprinters: ${payload[0].payload.numberOfSprinters}`}</p>
          )}
          {!!payload[0] && !!payload[0].payload.numberOfCars && (
            <p className="intro">{`Number of Cars: ${payload[0].payload.numberOfCars}`}</p>
          )}
        </div>
      )
    }

    return null
  }

  const primaryColor: { [key in GraphTypes]: string } = {
    bussing: 'var(--chart-primary-color)',
    bussingAggregate: 'var(--chart-primary-color)',
    services: 'var(--chart-primary-color)',
    serviceAggregate: 'var(--chart-primary-color)',
    serviceAggregateWithDollar: 'var(--chart-primary-color)',

    swellBussing: 'var(--chart-swollen-bussing-attendance-color)',
    rehearsals: 'var(--chart-hub-attendance-color)',
    rehearsalAggregate: 'var(--chart-hub-attendance-color)',
    ministryMeeting: 'var(--chart-hub-attendance-color)',
    onStageAttendance: 'var(--chart-onstage-attendance-color)',
    onStageAttendanceAggregate: 'var(--chart-onstage-attendance-color)',

    multiplicationAggregate: 'var(--chart-primary-color)',
  }

  const secondaryColor: { [key in GraphTypes]: string } = {
    bussing: 'var(--chart-secondary-color)',
    bussingAggregate: 'var(--chart-secondary-color)',
    services: 'var(--chart-secondary-color)',
    serviceAggregate: 'var(--chart-secondary-color)',
    serviceAggregateWithDollar: 'var(--chart-secondary-color)',

    swellBussing: 'var(--chart-swollen-bussing-attendance-color)',
    rehearsals: 'var(--chart-hub-income-color)',
    rehearsalAggregate: 'var(--chart-hub-income-color)',
    ministryMeeting: 'var(--chart-hub-income-color)',
    onStageAttendance: 'var(--chart-onstage-attendance-color)',
    onStageAttendanceAggregate: 'var(--chart-onstage-attendance-color)',

    multiplicationAggregate: 'var(--chart-secondary-color)',
  }

  return (
    <div className="row mt-2">
      <div className="col">
        <PlaceholderCustom loading={loading} as="p">
          <p className="chart-title font-weight-bold m-0">
            {stat2 &&
              `${capitalise(graphType)} ${capitalise(stat1)} and ${capitalise(
                stat2
              )}`}
            {!stat2 && income && `${graphType} ${capitalise(stat1)} Graph`}
            {!income && `${capitalise(stat1)}`}
          </p>
        </PlaceholderCustom>
        {secondaryTitle && (
          <PlaceholderCustom loading={loading} as="p">
            <p className="chart-title church-name">{`${secondaryTitle}`}</p>
          </PlaceholderCustom>
        )}
        {loading && (
          <Container className="chart-loader d-flex align-items-center justify-content-center">
            <ScaleLoader color="gray" className="mt-5" />
          </Container>
        )}
        {!loading && (
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={sortedData} margin={{ top: 20 }}>
              <defs>
                <linearGradient
                  id="colorPrimary"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={primaryColor[graphType]}
                    stopOpacity="1"
                  />
                  <stop
                    offset="90%"
                    stopColor={primaryColor[graphType]}
                    stopOpacity="0.1"
                  />
                </linearGradient>
                <linearGradient
                  id="colorSecondary"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={secondaryColor[graphType]}
                    stopOpacity="1"
                  />
                  <stop
                    offset="80%"
                    stopColor={secondaryColor[graphType]}
                    stopOpacity="0.1"
                  />
                </linearGradient>
              </defs>

              <Bar
                name={capitalise(stat1)}
                dataKey={`${stat1}`}
                barSize={30}
                yAxisId="left"
                fill="url(#colorPrimary)"
                onClick={(data: any) => {
                  const graphTypeActions: {
                    [key in string]: { typename: string; route: string }
                  } = {
                    bussing: {
                      typename: 'BussingRecord',
                      route: 'bussing-details',
                    },
                    onStageAttendance: {
                      typename: 'StageAttendanceRecord',
                      route: 'onstage-attendance-details',
                    },
                    default: {
                      typename: 'ServiceRecord',
                      route: 'service-details',
                    },
                  }

                  if (data.category?.includes('Aggregate') || !data.id) {
                    return
                  }

                  const action =
                    graphTypeActions[graphType] || graphTypeActions['default']
                  clickCard({ ...data, __typename: action.typename })
                  navigate(`/${props.church}/${action.route}`)
                }}
              >
                <LabelList dataKey={`${stat1}`} position="top" />
              </Bar>
              {stat2 && (
                <Bar
                  name={capitalise(stat2)}
                  dataKey={`${stat2}`}
                  barSize={35}
                  yAxisId="right"
                  fill="url(#colorSecondary)"
                  onClick={(data: any) => {
                    if (data.category.includes('Aggregate')) {
                      return
                    }

                    if (data.id && graphType === 'bussing') {
                      clickCard({ ...data, __typename: 'BussingRecord' })
                      navigate(`/${props.church}/bussing-details`)
                    } else if (data.id) {
                      clickCard({ ...data, __typename: 'ServiceRecord' })
                      navigate(`/${props.church}/service-details`)
                    }
                  }}
                >
                  <LabelList dataKey={`${stat2}`} position="top" />
                </Bar>
              )}

              <XAxis
                dataKey="week"
                tickLine={false}
                tickFormatter={(week) => {
                  if (!week) {
                    return 'No Data Found'
                  }
                  return 'Week ' + week
                }}
              />
              <YAxis
                hide={true}
                type="number"
                domain={[0, dataMax[`${stat1}`]]}
                yAxisId="left"
                orientation="left"
              />
              <YAxis
                hide={true}
                type="number"
                domain={[0, stat2 ? dataMax[`${stat2}`] : '']}
                yAxisId="right"
                orientation="right"
              />

              <Tooltip
                wrapperStyle={{
                  background: 'rgba(24, 24, 24, 0.3)',
                }}
                content={<CustomTooltip />}
                contentStyle={{
                  backgroundColor: 'rgba(24, 24, 24, 0.2)',
                  color: '#FFFFFF',
                }}
                cursor={{ stroke: 'grey', strokeWidth: 1, fillOpacity: 0 }}
              />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default ChurchGraph
