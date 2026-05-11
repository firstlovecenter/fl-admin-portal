import { ReactNode, useMemo } from 'react'

import MemberDisplayCard from 'components/card/MemberDisplayCard'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from 'components/ui/accordion'
import { Badge } from 'components/ui/badge'
import { cn } from 'components/lib/utils'

import { BacentaWithArrivals } from '../arrivals-types'
import BacentaArrivalsCard from './BacentaArrivalsCard'

export type AccordionTone = 'defaulters' | 'warning' | 'arrivals' | 'success'

const TONE_BADGE: Record<AccordionTone, string> = {
  defaulters: 'border-defaulters/30 bg-defaulters/10 text-defaulters',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  arrivals: 'border-arrivals/30 bg-arrivals/10 text-arrivals',
  success: 'border-success/30 bg-success/10 text-success',
}

const UNASSIGNED_GROUP_ID = 'unassigned'

type Group = {
  id: string
  name: string
  bacentas: BacentaWithArrivals[]
}

type Props = {
  bacentas: BacentaWithArrivals[]
  tone: AccordionTone
  onBacentaClick?: (bacenta: BacentaWithArrivals) => void
  renderExtra?: (bacenta: BacentaWithArrivals) => ReactNode
}

const BacentasByGovernorshipAccordion = ({
  bacentas,
  tone,
  onBacentaClick,
  renderExtra,
}: Props) => {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    bacentas.forEach((bacenta) => {
      const id = bacenta.governorship?.id ?? UNASSIGNED_GROUP_ID
      const name = bacenta.governorship?.name ?? 'Unassigned'
      const existing = map.get(id)
      if (existing) {
        existing.bacentas.push(bacenta)
      } else {
        map.set(id, { id, name, bacentas: [bacenta] })
      }
    })
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [bacentas])

  return (
    <Accordion type="multiple" className="space-y-3">
      {groups.map((group) => (
        <AccordionItem
          key={group.id}
          value={group.id}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <AccordionTrigger className="min-h-12 px-4 hover:no-underline">
            <div className="flex flex-1 items-center justify-between gap-3 pr-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {group.name}
              </span>
              <Badge
                variant="outline"
                className={cn('tabular-nums', TONE_BADGE[tone])}
              >
                {group.bacentas.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-1">
            <div className="space-y-3 md:hidden">
              {group.bacentas.map((bacenta) => (
                <MemberDisplayCard
                  key={bacenta.id}
                  member={bacenta}
                  leader={bacenta.leader}
                  contact
                  onClick={
                    onBacentaClick ? () => onBacentaClick(bacenta) : undefined
                  }
                >
                  {renderExtra?.(bacenta)}
                </MemberDisplayCard>
              ))}
            </div>
            <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
              {group.bacentas.map((bacenta) => (
                <BacentaArrivalsCard
                  key={bacenta.id}
                  bacenta={bacenta}
                  onClick={
                    onBacentaClick ? () => onBacentaClick(bacenta) : undefined
                  }
                >
                  {renderExtra?.(bacenta)}
                </BacentaArrivalsCard>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default BacentasByGovernorshipAccordion
