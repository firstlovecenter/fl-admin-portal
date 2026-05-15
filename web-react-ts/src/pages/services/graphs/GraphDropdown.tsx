import React, { useEffect, useMemo } from 'react'
import { Button } from 'components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { ChurchLevel } from 'global-types'
import { GraphTypes, getServiceGraphData } from './graphs-utils'
import './GraphDropdown.css'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchData])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="destructive">
          {selected}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        {churchLevel === 'Bacenta' && (
          <DropdownMenuItem
            className="py-3"
            onSelect={() => {
              setSelected('Bussing')
              setGraphs('bussing')
            }}
          >
            Bussing
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="py-3"
          onSelect={() => {
            setSelected('Services')
            setGraphs('services')
          }}
        >
          {`${churchLevel} Services`}
        </DropdownMenuItem>
        {churchLevel !== 'Bacenta' && (
          <DropdownMenuItem
            className="py-3"
            onSelect={() => {
              setSelected('Bussing Total')
              setGraphs('bussingAggregate')
            }}
          >
            Bussing Total
          </DropdownMenuItem>
        )}
        {!['Bacenta', 'Oversight', 'Denomination'].includes(churchLevel) && (
          <DropdownMenuItem
            className="py-3"
            onSelect={() => {
              setSelected('Bacenta Total')
              setGraphs('serviceAggregate')
            }}
          >
            Weekday Total
          </DropdownMenuItem>
        )}
        {['Campus', 'Oversight', 'Denomination'].includes(churchLevel) && (
          <DropdownMenuItem
            className="py-3"
            onSelect={() => {
              setSelected('Services Total (USD)')
              setGraphs('serviceAggregateWithDollar')
            }}
          >
            Weekday Total (USD)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default GraphDropdown
