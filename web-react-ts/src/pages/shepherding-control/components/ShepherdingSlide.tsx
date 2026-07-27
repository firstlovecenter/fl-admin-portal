import { useTranslation } from 'react-i18next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from 'components/ui/avatar'
import LoadingScreen from 'components/base-component/LoadingScreen'
import { cn } from 'components/lib/utils'
import {
  AnchorWeekYear,
  ChildSummary,
  MetricKey,
  SlideData,
  WindowWeeks,
} from 'pages/shepherding-control/shepherding-control-types'
import { nextLevelFor } from 'pages/shepherding-control/shepherding-control-utils'
import ChildChurchCard from './ChildChurchCard'
import ProjectionChart from './ProjectionChart'

type Props = {
  slide: SlideData | null
  loading: boolean
  metricA: MetricKey
  metricB: MetricKey | null
  anchor: AnchorWeekYear
  windowWeeks: WindowWeeks
  onSelectChild: (child: ChildSummary) => void
}

const ShepherdingSlide = ({
  slide,
  loading,
  metricA,
  metricB,
  anchor,
  windowWeeks,
  onSelectChild,
}: Props) => {
  const { t } = useTranslation()

  if (!slide) {
    return <LoadingScreen text={t('shepherding.loadingSlide')} />
  }

  const leader = slide.leader
  const initials = `${leader?.firstName?.[0] ?? ''}${
    leader?.lastName?.[0] ?? ''
  }`
  const showBacentaCount = slide.level !== 'Bacenta'
  const childLevel = nextLevelFor(slide.level)
  const childLabel =
    childLevel == null
      ? null
      : slide.children.length === 1
        ? t(`shared.churchLevel.${childLevel}`)
        : t(`shared.churchLevelPlural.${childLevel}`)

  return (
    <div className="flex h-full w-full flex-col gap-8 p-8 text-foreground">
      <header className="flex items-center gap-8">
        <Avatar className="h-32 w-32 shrink-0 border-2 border-border">
          <AvatarImage
            src={leader?.pictureUrl ?? undefined}
            alt={leader?.nameWithTitle ?? slide.name}
          />
          <AvatarFallback className="bg-muted text-3xl font-semibold text-muted-foreground">
            {initials || '—'}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-2xl uppercase tracking-[0.2em] text-muted-foreground">
            {t(`shared.churchLevel.${slide.level}`)}
          </p>
          <h1 className="mt-2 truncate text-6xl font-bold tracking-tight">
            {slide.name}
          </h1>
          <p
            className={cn(
              'mt-3 truncate text-3xl font-medium',
              leader ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {leader?.nameWithTitle ?? t('shepherding.noLeaderAssigned')}
          </p>
        </div>

        <div className="hidden flex-col items-end gap-1 text-right md:flex">
          {showBacentaCount && slide.bacentaCount != null && (
            <p className="text-2xl tabular-nums">
              <span className="text-5xl font-bold">{slide.bacentaCount}</span>
              <span className="ml-2 text-muted-foreground">
                {t('shepherding.bacentas')}
              </span>
            </p>
          )}
          {slide.memberCount != null && (
            <p className="text-2xl tabular-nums">
              <span className="text-5xl font-bold">{slide.memberCount}</span>
              <span className="ml-2 text-muted-foreground">
                {t('shepherding.members')}
              </span>
            </p>
          )}
        </div>
      </header>

      <section className="flex-1">
        <ProjectionChart
          level={slide.level}
          serviceRecords={slide.aggregateServiceRecords ?? []}
          bussingRecords={slide.aggregateBussingRecords ?? []}
          metricA={metricA}
          metricB={metricB}
          anchor={anchor}
          windowWeeks={windowWeeks}
          loading={loading}
        />
      </section>

      {slide.children?.length > 0 && (
        <section className="space-y-3">
          <p className="text-2xl uppercase tracking-wider text-muted-foreground">
            {slide.children.length} {childLabel}
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {slide.children.map((child) => (
              <ChildChurchCard
                key={child.id}
                child={child}
                onSelect={onSelectChild}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ShepherdingSlide
