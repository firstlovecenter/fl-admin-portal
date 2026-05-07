import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseDate, parseNeoTime } from 'jd-date-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { HistoryLog } from 'global-types'
import {
  AceternityTimeline,
  AceternityTimelineEntry,
} from 'components/ui/aceternity-timeline'
import { Skeleton } from 'components/ui/skeleton'

export type TimelineElement = HistoryLog

type TimelineProps = {
  entries: TimelineElement[]
  fetchingMore?: boolean
  hasMore?: boolean
  sentinelRef?: (el: HTMLElement | null) => void
}

const Timeline = ({
  entries,
  fetchingMore = false,
  hasMore = false,
  sentinelRef,
}: TimelineProps) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  if (!entries?.length && !fetchingMore) {
    return null
  }

  const aceternityEntries: AceternityTimelineEntry[] = entries.map(
    (element, index) => {
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
    }
  )

  return (
    <>
      {aceternityEntries.length > 0 && (
        <AceternityTimeline data={aceternityEntries} />
      )}
      {fetchingMore && (
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      {hasMore && sentinelRef && (
        <div ref={sentinelRef} aria-hidden className="h-1" />
      )}
    </>
  )
}

export default Timeline
