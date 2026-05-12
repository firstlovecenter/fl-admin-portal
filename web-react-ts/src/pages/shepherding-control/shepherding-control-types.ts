export type MetricKey = 'serviceAttendance' | 'bussingAttendance' | 'income'

export type MetricUnit = 'attendance' | 'cedis'

export type ShepherdingLevel =
  | 'Denomination'
  | 'Oversight'
  | 'Campus'
  | 'Stream'
  | 'Council'
  | 'Governorship'
  | 'Bacenta'

export type SlideNode = {
  type: ShepherdingLevel
  id: string
  name: string
}

export type ChildSummary = {
  id: string
  name: string
}

export type LeaderSummary = {
  id: string
  pictureUrl: string | null
  nameWithTitle: string | null
  firstName: string | null
  lastName: string | null
}

export type AggregateRecord = {
  id: string
  week: number | null
  year: number | null
  attendance: number | null
  income?: number | null
  numberOfServices?: number | null
}

export type SlideData = {
  id: string
  name: string
  level: ShepherdingLevel
  leader: LeaderSummary | null
  memberCount: number | null
  bacentaCount: number | null
  aggregateServiceRecords: AggregateRecord[]
  aggregateBussingRecords: AggregateRecord[]
  children: ChildSummary[]
}

export type DepthChoice = 'this-level' | 'one-level-deeper' | 'full-subtree'

export type WindowWeeks = 4 | 6 | 8

export type AnchorWeekYear = {
  week: number
  year: number
}
