'use client'

import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { ChurchContext } from '../../contexts/ChurchContext'
import './Timeline.css'
import { parseDate, parseNeoTime } from 'jd-date-utils'
import { HistoryLog } from 'global-types'

export type TimelineElement = HistoryLog

type TimelineProps = {
  limit: number
  modifier?: 'church'
  record: TimelineElement[]
}

const Timeline = (props: TimelineProps) => {
  const { record, limit, modifier } = props

  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()

  if (!record) {
    return null
  }
  if (record && modifier === 'church') {
    return (
      <ul className="timeline">
        {record.map(
          (element: TimelineElement, index: number) =>
            index < 5 && (
              <li key={index}>
                <p className="timeline-text">
                  {element.historyRecord}
                  <br />
                  <small className="text-secondary">
                    {`${parseDate(element.createdAt?.date)} at ${parseNeoTime(
                      element.timeStamp
                    )}`}
                    {element?.loggedBy && ' by'}
                    <span
                      className="font-weight-bold"
                      onClick={() => {
                        clickCard(element?.loggedBy)
                        router.push('/member/displaydetails')
                      }}
                    >
                      {element?.loggedBy &&
                        ` ${element?.loggedBy?.firstName} ${element?.loggedBy?.lastName}`}
                    </span>
                  </small>
                </p>
              </li>
            )
        )}
      </ul>
    )
  }

  return (
    <ul className="timeline">
      {record.map(
        (element, index) =>
          index < limit && (
            <li key={index}>
              <p className="timeline-text">
                {element.historyRecord}
                <br />
                <small className="text-secondary">
                  {`${parseDate(element.createdAt?.date)} at ${parseNeoTime(
                    element.timeStamp
                  )}`}
                  {element?.loggedBy && ' by '}
                  <span
                    className="font-weight-bold"
                    onClick={() => {
                      clickCard(element?.loggedBy)
                      router.push('/member/displaydetails')
                    }}
                  >
                    {element?.loggedBy &&
                      `${element?.loggedBy?.firstName} ${element?.loggedBy?.lastName}`}
                  </span>
                </small>
              </p>
            </li>
          )
      )}
    </ul>
  )
}

export default Timeline
