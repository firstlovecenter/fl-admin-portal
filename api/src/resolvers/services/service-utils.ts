import { SontaHigherChurches } from '../utils/types'
import {
  aggregateHubRehearsalDataForCreativeArts,
  aggregateHubRehearsalDataForHubCouncil,
  aggregateHubRehearsalDataForMinistry,
  aggregateMinistryMeetingDataForCreativeArts,
  aggregateMinistryMeetingDataForMinistry,
  aggregateStageAttendanceDataForCreativeArts,
} from './rehearsal-cypher'

export const getServiceSontaHigherChurches = (records: any) => {
  const sontaHigherChurches: SontaHigherChurches = {}

  records?.map((record: any) => {
    if (record?.get('higherChurch').labels.includes('HubCouncil')) {
      sontaHigherChurches.hubCouncil = {
        typename: 'HubCouncil',
        labels: record?.get('higherChurch').labels,
        properties: record.get('higherChurch').properties,
        rehearsalCypher: aggregateHubRehearsalDataForHubCouncil,
        ministryMeetingCypher: aggregateMinistryMeetingDataForMinistry,
        ministryStagePerformanceCypher:
          aggregateStageAttendanceDataForCreativeArts,
      }
    }
    if (record?.get('higherChurch').labels.includes('Ministry')) {
      sontaHigherChurches.ministry = {
        typename: 'Ministry',
        labels: record?.get('higherChurch').labels,
        properties: record.get('higherChurch').properties,
        rehearsalCypher: aggregateHubRehearsalDataForMinistry,
        ministryMeetingCypher: aggregateMinistryMeetingDataForMinistry,
        ministryStagePerformanceCypher:
          aggregateStageAttendanceDataForCreativeArts,
      }
    }

    if (record?.get('higherChurch').labels.includes('CreativeArts')) {
      sontaHigherChurches.creativeArts = {
        typename: 'CreativeArts',
        labels: record?.get('higherChurch').labels,
        properties: record.get('higherChurch').properties,
        rehearsalCypher: aggregateHubRehearsalDataForCreativeArts,
        ministryMeetingCypher: aggregateMinistryMeetingDataForCreativeArts,
        ministryStagePerformanceCypher:
          aggregateStageAttendanceDataForCreativeArts,
      }
    }

    return null
  })

  return sontaHigherChurches
}

export default getServiceSontaHigherChurches
