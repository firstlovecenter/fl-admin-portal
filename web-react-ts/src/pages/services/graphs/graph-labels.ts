import type { TFunction } from 'i18next'
import type { ChurchLevel } from 'global-types'
import { formatChurchLevel } from 'lib/scope-display'
import type { GraphTypes } from './graphs-utils'

/** Shared chrome labels used by every *Graphs.tsx page. */
export const getGraphPageLabels = (t: TFunction, level: ChurchLevel) => {
  const levelLabel = formatChurchLevel(level, t)
  return {
    trends: t('services.graphs.trends'),
    leaderTitle: t('services.graphs.leaderTitle', { level: levelLabel }),
    membership: t('services.graphs.membership'),
    tapToView: t('services.graphs.tapToView'),
    avgWeeklyBussing: t('services.graphs.avgWeeklyBussing'),
    avgWeeklyAttendance: t('services.graphs.avgWeeklyAttendance'),
    avgWeeklyIncome: t('services.graphs.avgWeeklyIncome'),
    notTracked: t('services.graphs.notTracked'),
    noServiceData: t('services.graphs.noServiceData'),
    older: t('services.graphs.older'),
    newer: t('services.graphs.newer'),
    weeksRange: (first: number, last: number, year: number) =>
      t('services.graphs.weeksRange', { first, last, year }),
    weekShort: (week: number, year?: number) =>
      year
        ? t('services.graphs.weekShortYear', {
            week,
            yearSuffix: String(year).slice(-2),
          })
        : t('services.graphs.weekShort', { week }),
    fallbackChurchName: levelLabel,
  }
}

/** Bacenta tab options. */
export const bacentaGraphOptions = (
  t: TFunction
): { value: GraphTypes; label: string }[] => [
  { value: 'bussing', label: t('services.graphs.options.bussing') },
  { value: 'services', label: t('services.graphs.options.services') },
]

/** Standard higher-level tab options (joint / all services / all bussing). */
export const higherChurchGraphOptions = (
  t: TFunction
): { value: GraphTypes; label: string }[] => [
  { value: 'services', label: t('services.graphs.options.jointService') },
  {
    value: 'serviceAggregate',
    label: t('services.graphs.options.allServices'),
  },
  {
    value: 'bussingAggregate',
    label: t('services.graphs.options.allBussing'),
  },
]

export const campusGraphOptions = (
  t: TFunction
): { value: GraphTypes; label: string }[] => [
  { value: 'services', label: t('services.graphs.options.jointService') },
  {
    value: 'serviceAggregate',
    label: t('services.graphs.options.allServices'),
  },
  {
    value: 'serviceAggregateWithDollar',
    label: t('services.graphs.options.allServicesUsd'),
  },
  {
    value: 'bussingAggregate',
    label: t('services.graphs.options.allBussing'),
  },
]

export const denominationGraphOptions = (
  t: TFunction
): { value: GraphTypes; label: string }[] => [
  {
    value: 'serviceAggregate',
    label: t('services.graphs.options.allServices'),
  },
  {
    value: 'bussingAggregate',
    label: t('services.graphs.options.allBussing'),
  },
]

export const oversightGraphOptions = (
  t: TFunction
): { value: GraphTypes; label: string }[] => [
  { value: 'services', label: t('services.graphs.options.jointService') },
  {
    value: 'serviceAggregate',
    label: t('services.graphs.options.allServices'),
  },
  {
    value: 'bussingAggregate',
    label: t('services.graphs.options.allBussing'),
  },
]
