import type { TFunction } from 'i18next'

// HistoryLog.historyRecord is persisted English audit text (ADR-017 /
// plan.md phase 3f/3h). We never rewrite stored nodes — that would mix
// languages across entries depending on who wrote them. Instead Timeline
// runs known templates through i18n at display time and falls back to the
// original English string when no pattern matches.

const LEVEL =
  'Bacenta|Governorship|Council|Stream|Campus|Oversight|Denomination'

const CANONICAL_LEVELS = new Set([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
])

const levelLabel = (raw: string, t: TFunction): string => {
  const normalized =
    raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  if (!CANONICAL_LEVELS.has(normalized)) return raw
  // Bacenta stays Bacenta in every locale (glossary).
  if (normalized === 'Bacenta') return 'Bacenta'
  return t(`shared.churchLevel.${normalized}`, { defaultValue: normalized })
}

type Pattern = {
  re: RegExp
  render: (match: RegExpMatchArray, t: TFunction) => string
}

const PATTERNS: Pattern[] = [
  {
    re: new RegExp(`^(.+?) (${LEVEL}) History Begins$`, 'i'),
    render: (m, t) =>
      t('directory.historyRecord.historyBegins', {
        name: m[1],
        level: levelLabel(m[2], t),
      }),
  },
  {
    re: new RegExp(
      `^(.+?) (${LEVEL}) was closed down under (.+?) (${LEVEL})$`,
      'i'
    ),
    render: (m, t) =>
      t('directory.historyRecord.closedDown', {
        name: m[1],
        level: levelLabel(m[2], t),
        parentName: m[3],
        parentLevel: levelLabel(m[4], t),
      }),
  },
  {
    re: new RegExp(
      `^(.+?) was removed as the (${LEVEL}) (.+?) for\\s+(.+?) (${LEVEL})$`,
      'i'
    ),
    render: (m, t) =>
      t('directory.historyRecord.removedAsServant', {
        servant: m[1],
        churchType: levelLabel(m[2], t),
        servantType: m[3],
        churchName: m[4],
      }),
  },
  {
    re: new RegExp(
      `^(.+?) became the (.+?) of (.+?) (${LEVEL}) replacing (.+)$`,
      'i'
    ),
    render: (m, t) =>
      t('directory.historyRecord.becameReplacing', {
        servant: m[1],
        servantType: m[2],
        churchName: m[3],
        churchType: levelLabel(m[4], t),
        oldServant: m[5],
      }),
  },
  {
    re: new RegExp(`^(.+?) became the (.+?) of (.+?) (${LEVEL})$`, 'i'),
    render: (m, t) =>
      t('directory.historyRecord.became', {
        servant: m[1],
        servantType: m[2],
        churchName: m[3],
        churchType: levelLabel(m[4], t),
      }),
  },
  {
    re: new RegExp(
      `^(.+?) started (.+?) (${LEVEL}) under (.+?) (${LEVEL})$`,
      'i'
    ),
    render: (m, t) =>
      t('directory.historyRecord.startedUnder', {
        servant: m[1],
        churchName: m[2],
        churchType: levelLabel(m[3], t),
        parentName: m[4],
        parentLevel: levelLabel(m[5], t),
      }),
  },
  {
    re: new RegExp(
      `^(${LEVEL}) name has been changed from (.+) to (.+)$`,
      'i'
    ),
    render: (m, t) =>
      t('directory.historyRecord.nameChanged', {
        level: levelLabel(m[1], t),
        from: m[2],
        to: m[3],
      }),
  },
  {
    re: /^(.+) moved from (.+) Bacenta to (.+) Bacenta$/,
    render: (m, t) =>
      t('directory.historyRecord.memberMovedBacenta', {
        member: m[1],
        from: m[2],
        to: m[3],
      }),
  },
  {
    re: /^Added Sticky Note: (.+)$/,
    render: (m, t) =>
      t('directory.historyRecord.addedStickyNote', { note: m[1] }),
  },
  {
    re: /^Deleted Sticky Note$/,
    render: (_m, t) => t('directory.historyRecord.deletedStickyNote'),
  },
  {
    re: /^(.+) Bussing Details were updated$/,
    render: (m, t) =>
      t('directory.historyRecord.bussingDetailsUpdated', { name: m[1] }),
  },
  {
    re: /^(.+) Bus Payment Details were updated$/,
    render: (m, t) =>
      t('directory.historyRecord.busPaymentDetailsUpdated', { name: m[1] }),
  },
  {
    re: /^(.+) Details were updated$/,
    render: (m, t) =>
      t('directory.historyRecord.detailsUpdated', { subject: m[1] }),
  },
]

export const translateHistoryRecord = (
  historyRecord: string | undefined | null,
  t: TFunction
): string => {
  if (!historyRecord) return ''
  for (const { re, render } of PATTERNS) {
    const match = historyRecord.match(re)
    if (match) return render(match, t)
  }
  return historyRecord
}
