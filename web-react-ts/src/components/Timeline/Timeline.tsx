import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseDate, parseNeoTime } from 'jd-date-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { HistoryLog } from 'global-types'
import {
  AceternityTimeline,
  AceternityTimelineEntry,
} from 'components/ui/aceternity-timeline'

export type TimelineElement = HistoryLog

type TimelineProps = {
  limit: number
  record: TimelineElement[]
}

const Timeline = ({ record, limit }: TimelineProps) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  if (!record?.length) {
    return null
  }

  const entries: AceternityTimelineEntry[] = record
    .slice(0, limit)
    .map((element, index) => {
      const author = element?.loggedBy
      const authorName = author
        ? `${author.firstName} ${author.lastName}`
        : null

      return {
        key: element.id ?? `${element.timeStamp ?? ''}-${index}`,
        title: parseDate(element.createdAt?.date),
        dateTime: element.createdAt?.date,
        content: (
          <div className="space-y-1.5">
            <p className="text-sm leading-snug font-medium text-foreground">
              {element.historyRecord}
            </p>
            <p className="text-xs text-muted-foreground">
              {parseNeoTime(element.timeStamp)}
            </p>
            {authorName && (
              <button
                type="button"
                onClick={() => {
                  clickCard(author)
                  navigate('/member/displaydetails')
                }}
                className="inline-flex min-h-11 items-center text-xs font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {authorName}
              </button>
            )}
          </div>
        ),
      }
    })

  return <AceternityTimeline data={entries} />
}

export default Timeline
