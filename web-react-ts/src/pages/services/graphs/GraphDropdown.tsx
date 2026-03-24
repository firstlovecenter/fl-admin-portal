import React, { useEffect, useMemo } from 'react'
import { GraphTypes, getServiceGraphData } from './graphs-utils'
import './GraphDropdown.css'
import { ChurchLevel } from 'global-types'

type GraphDropdownProps = {
  setChurchData: React.Dispatch<React.SetStateAction<any>>
  setGraphs: React.Dispatch<React.SetStateAction<GraphTypes>>
  graphs: GraphTypes
  data: any
}

const GraphDropdown = ({
  setChurchData,
  graphs,
  setGraphs,
  data,
}: GraphDropdownProps) => {
  const [selected, setSelected] = React.useState('Select Service')
  const churchLevel: ChurchLevel = data?.__typename

  const sontaLevels = ['Hub', 'HubCouncil', 'Ministry', 'CreativeArts']

  const churchData = useMemo(
    () => getServiceGraphData(data, graphs),
    [data, graphs]
  )

  useEffect(() => {
    setChurchData(churchData)
  }, [churchData])

  return (
    <div className="dropdown relative">
      <button className="dropdown-toggle">{selected}</button>

      <div className="dropdown-menu">
        {churchLevel === 'Bacenta' && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('Bussing')
              setGraphs('bussing')
            }}
          >
            Bussing
          </div>
        )}

        {![...sontaLevels].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('Services')
              setGraphs('services')
            }}
          >
            {`${churchLevel} Services`}
          </div>
        )}
        {['CreativeArts'].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('OnStage Attendance')
              setGraphs('onStageAttendanceAggregate')
            }}
          >
            {`On Stage Attendance Total`}
          </div>
        )}
        {['Ministry'].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('OnStage Attendance')
              setGraphs('onStageAttendance')
            }}
          >
            {`On Stage Attendance`}
          </div>
        )}

        {!['Bacenta', ...sontaLevels].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('Bussing Total')
              setGraphs('bussingAggregate')
            }}
          >
            Bussing Total
          </div>
        )}
        {!['Bacenta', 'Oversight', 'Denomination'].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('Bacenta Total')
              setGraphs('serviceAggregate')
            }}
          >
            Weekday Total
          </div>
        )}
        {['Campus', 'Oversight', 'Denomination'].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('Services Total (USD)')
              setGraphs('serviceAggregateWithDollar')
            }}
          >
            Weekday Total (USD)
          </div>
        )}

        {['Hub', 'HubCouncil'].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('Rehearsals')
              setGraphs('rehearsals')
            }}
          >
            {`${churchLevel} Rehearsals`}
          </div>
        )}

        {['Ministry', 'CreativeArts', 'HubCouncil'].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('Rehearsals Total')
              setGraphs('rehearsalAggregate')
            }}
          >
            {`${churchLevel} Rehearsals Total`}
          </div>
        )}
        {['Ministry', 'CreativeArts'].includes(churchLevel) && (
          <div
            className="py-3"
            onClick={() => {
              setSelected('Rehearsals')
              setGraphs('ministryMeeting')
            }}
          >
            {`${churchLevel} Weekend Meeting Total`}
          </div>
        )}
      </div>
    </div>
  )
}

export default GraphDropdown
