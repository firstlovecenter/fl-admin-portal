import { useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  BookMarked,
  BookOpen,
  ChevronDown,
  HandHeart,
  Quote,
  Sparkles,
} from 'lucide-react'
import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'
import {
  WEEKLY_TIP_FOR_CHURCH,
  type WeeklyTipForChurchResult,
} from 'pages/dashboards/userWeeklyTipQueries'

type Props = {
  churchId: string | null | undefined
}

type Tip = NonNullable<WeeklyTipForChurchResult['weeklyTipForChurch']>

const SectionHeader = () => (
  <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 lg:py-3">
    <Sparkles
      className="size-3.5 lg:size-4"
      style={{ color: 'hsl(var(--arrivals))' }}
    />
    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:text-xs">
      Tip of the week
    </h3>
  </div>
)

const ExpandedDetails = ({ tip }: { tip: Tip }) => {
  const {
    scripture,
    scriptureSnippet,
    quotedPassage,
    passageSnippet,
    prayerPrompt,
  } = tip
  const scriptureQuote = scriptureSnippet || scripture?.text
  const passageQuote = passageSnippet || quotedPassage?.text

  if (!scriptureQuote && !passageQuote && !prayerPrompt) return null

  return (
    <div className="space-y-3 border-t border-border/60 px-4 py-3 lg:py-4">
      {scriptureQuote && scripture && (
        <div className="flex gap-2.5">
          <BookOpen
            className="mt-0.5 size-3.5 shrink-0"
            style={{ color: 'hsl(var(--arrivals))' }}
          />
          <div className="min-w-0 flex-1">
            <blockquote className="text-xs italic leading-relaxed text-foreground">
              &ldquo;{scriptureQuote}&rdquo;
            </blockquote>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {scripture.book} {scripture.chapter}:{scripture.verse} (
              {scripture.translation})
            </p>
          </div>
        </div>
      )}

      {passageQuote && quotedPassage && (
        <div className="flex gap-2.5">
          <Quote
            className="mt-0.5 size-3.5 shrink-0"
            style={{ color: 'hsl(var(--arrivals))' }}
          />
          <div className="min-w-0 flex-1">
            <blockquote className="text-xs leading-relaxed text-foreground">
              &ldquo;{passageQuote}&rdquo;
            </blockquote>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Daddy
              {tip.recommendedBook ? ` — ${tip.recommendedBook.title}` : ''}
            </p>
          </div>
        </div>
      )}

      {prayerPrompt && (
        <div className="flex gap-2.5">
          <HandHeart
            className="mt-0.5 size-3.5 shrink-0"
            style={{ color: 'hsl(var(--brand))' }}
          />
          <p className="text-xs leading-relaxed text-foreground">
            {prayerPrompt}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Weekly-tip surface. Always renders as an inline card in the dashboard
 * aside on every breakpoint — mobile uses tighter spacing + smaller type.
 *
 * Default state shows only the headline tip + book recommendation; a
 * "View more" toggle reveals the scripture snippet, founder passage
 * snippet, and prayer prompt. Hides the noise on the dashboard while
 * keeping the deeper content one tap away.
 */
const WeeklyTipCard = ({ churchId }: Props) => {
  const [expanded, setExpanded] = useState(false)
  const { data, loading } = useQuery<WeeklyTipForChurchResult>(
    WEEKLY_TIP_FOR_CHURCH,
    {
      variables: { churchId: churchId ?? '' },
      skip: !churchId,
      fetchPolicy: 'cache-first',
    }
  )

  if (!churchId) return null

  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <SectionHeader />
        <div className="space-y-2 p-4">
          <Skeleton className="h-3.5 w-11/12 lg:h-4" />
          <Skeleton className="h-3.5 w-3/4 lg:h-4" />
        </div>
      </section>
    )
  }

  const tip = data?.weeklyTipForChurch
  if (!tip) return null

  const hasMore =
    Boolean(tip.scripture || tip.quotedPassage || tip.prayerPrompt)

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <SectionHeader />

      {/* Always-visible: body sentence + book recommendation */}
      <div className="space-y-3 p-4">
        <p className="text-xs font-medium leading-relaxed text-foreground lg:text-sm">
          {tip.body}
        </p>

        {tip.recommendedBook && (
          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-3">
            <BookMarked
              className="mt-0.5 size-3.5 shrink-0"
              style={{ color: 'hsl(var(--arrivals))' }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Read next
              </p>
              <p className="mt-0.5 text-xs font-medium text-foreground">
                {tip.recommendedBook.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {tip.recommendedBook.author}
              </p>
              {tip.recommendedChapter && (
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  Ch. {tip.recommendedChapter.order}
                  {tip.recommendedChapter.title
                    ? ` — ${tip.recommendedChapter.title}`
                    : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded: scripture + passage + prayer */}
      {expanded && <ExpandedDetails tip={tip} />}

      {/* Toggle */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 border-t border-border/60 bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground"
        >
          {expanded ? 'Show less' : 'View more'}
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </button>
      )}
    </section>
  )
}

export default WeeklyTipCard
