import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { ChurchLevel } from 'global-types'
import { formatChurchLevel } from 'lib/scope-display'
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
  const { t, i18n } = useTranslation()
  const churchLevel: ChurchLevel = data?.__typename

  const selected = useMemo(() => {
    switch (graphs) {
      case 'bussing':
        return t('services.graphs.options.bussing')
      case 'services':
        return t('services.graphs.options.levelServices', {
          level: formatChurchLevel(churchLevel, t),
        })
      case 'bussingAggregate':
        return t('services.graphs.options.bussingTotal')
      case 'serviceAggregate':
        return t('services.graphs.options.weekdayTotal')
      case 'serviceAggregateWithDollar':
        return t('services.graphs.options.weekdayTotalUsd')
      default:
        return t('services.graphs.selectService')
    }
  }, [graphs, churchLevel, t, i18n.language])

  const churchData = useMemo(
    () => getServiceGraphData(data, graphs, undefined, t),
    [data, graphs, t]
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
              setGraphs('bussing')
            }}
          >
            {t('services.graphs.options.bussing')}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="py-3"
          onSelect={() => {
            setGraphs('services')
          }}
        >
          {t('services.graphs.options.levelServices', {
            level: formatChurchLevel(churchLevel, t),
          })}
        </DropdownMenuItem>
        {churchLevel !== 'Bacenta' && (
          <DropdownMenuItem
            className="py-3"
            onSelect={() => {
              setGraphs('bussingAggregate')
            }}
          >
            {t('services.graphs.options.bussingTotal')}
          </DropdownMenuItem>
        )}
        {!['Bacenta', 'Oversight', 'Denomination'].includes(churchLevel) && (
          <DropdownMenuItem
            className="py-3"
            onSelect={() => {
              setGraphs('serviceAggregate')
            }}
          >
            {t('services.graphs.options.weekdayTotal')}
          </DropdownMenuItem>
        )}
        {['Campus', 'Oversight', 'Denomination'].includes(churchLevel) && (
          <DropdownMenuItem
            className="py-3"
            onSelect={() => {
              setGraphs('serviceAggregateWithDollar')
            }}
          >
            {t('services.graphs.options.weekdayTotalUsd')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default GraphDropdown
