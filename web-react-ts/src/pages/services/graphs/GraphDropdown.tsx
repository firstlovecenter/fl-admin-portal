import React, { useEffect, useMemo } from 'react'
import { Dropdown } from 'react-bootstrap'
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


  const churchData = useMemo(
    () => getServiceGraphData(data, graphs),
    [data, graphs]
  )

  useEffect(() => {
    setChurchData(churchData)
  }, [churchData])

  return (
    <Dropdown className="border-none">
      <Dropdown.Toggle variant="danger">{selected}</Dropdown.Toggle>

      <Dropdown.Menu variant="dark">
        {churchLevel === 'Bacenta' && (
          <Dropdown.Item
            className="py-3"
            onClick={() => {
              setSelected('Bussing')
              setGraphs('bussing')
            }}
          >
            Bussing
          </Dropdown.Item>
        )}

        <Dropdown.Item
          className="py-3"
          onClick={() => {
            setSelected('Services')
            setGraphs('services')
          }}
        >
          {`${churchLevel} Services`}
        </Dropdown.Item>
        {churchLevel !== 'Bacenta' && (
          <Dropdown.Item
            className="py-3"
            onClick={() => {
              setSelected('Bussing Total')
              setGraphs('bussingAggregate')
            }}
          >
            Bussing Total
          </Dropdown.Item>
        )}
        {!['Bacenta', 'Oversight', 'Denomination'].includes(churchLevel) && (
          <Dropdown.Item
            className="py-3"
            onClick={() => {
              setSelected('Bacenta Total')
              setGraphs('serviceAggregate')
            }}
          >
            Weekday Total
          </Dropdown.Item>
        )}
        {['Campus', 'Oversight', 'Denomination'].includes(churchLevel) && (
          <Dropdown.Item
            className="py-3"
            onClick={() => {
              setSelected('Services Total (USD)')
              setGraphs('serviceAggregateWithDollar')
            }}
          >
            Weekday Total (USD)
          </Dropdown.Item>
        )}

      </Dropdown.Menu>
    </Dropdown>
  )
}

export default GraphDropdown
