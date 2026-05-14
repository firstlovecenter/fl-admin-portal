import { useQuery } from '@apollo/client'
import { motion } from 'motion/react'
import { Sparkles, BookOpen, Quote, BookMarked } from 'lucide-react'
import { Skeleton } from 'components/ui/skeleton'
import {
  WEEKLY_TIP_FOR_CHURCH,
  type WeeklyTipForChurchResult,
} from 'pages/dashboards/userWeeklyTipQueries'

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

type Props = {
  churchId: string | null | undefined
}

/**
 * Renders the current week's tip for the church the leader has selected in
 * their scope picker. The tip belongs to the church, not the leader — a
 * leader of multiple churches sees a distinct tip per scope; co-leaders of
 * the same church see the same tip. Returns null when no churchId is
 * available (e.g. before the scope context has hydrated) or when the Lambda
 * hasn't produced this week's tip yet.
 */
const WeeklyTipCard = ({ churchId }: Props) => {
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
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <h2 className="text-base font-medium text-foreground">
            Tip of the week
          </h2>
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </section>
    )
  }

  const tip = data?.weeklyTipForChurch
  if (!tip) return null

  const { scripture, quotedPassage, recommendedBook } = tip

  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex items-center gap-2">
        <Sparkles
          className="size-4"
          style={{ color: 'hsl(var(--arrivals))' }}
        />
        <h2 className="text-base font-medium text-foreground">
          Tip of the week
        </h2>
      </div>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground">
        {tip.body}
      </p>

      {scripture && (
        <figure className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-3.5" />
            Scripture
          </div>
          <blockquote className="mt-2 text-sm italic leading-relaxed text-foreground">
            “{scripture.text}”
          </blockquote>
          <figcaption className="mt-2 text-xs text-muted-foreground">
            {scripture.book} {scripture.chapter}:{scripture.verse} (
            {scripture.translation})
          </figcaption>
        </figure>
      )}

      {quotedPassage && (
        <figure className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Quote className="size-3.5" />
            From the founder
          </div>
          <blockquote className="mt-2 text-sm leading-relaxed text-foreground">
            {quotedPassage.text}
          </blockquote>
          <figcaption className="mt-2 text-xs text-muted-foreground">
            {quotedPassage.citationLabel}
            {recommendedBook ? ` — ${recommendedBook.title}` : ''}
          </figcaption>
        </figure>
      )}

      {recommendedBook && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
          <BookMarked
            className="size-4 shrink-0"
            style={{ color: 'hsl(var(--arrivals))' }}
          />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Recommended reading
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {recommendedBook.title}
            </p>
            {recommendedBook.subtitle && (
              <p className="text-xs text-muted-foreground">
                {recommendedBook.subtitle}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {recommendedBook.author}
              {recommendedBook.publishedYear
                ? ` · ${recommendedBook.publishedYear}`
                : ''}
            </p>
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default WeeklyTipCard
