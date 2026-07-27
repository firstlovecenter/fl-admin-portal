import { Trans, useTranslation } from 'react-i18next'

const Sabbath = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-svh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          {/* One key, not a `title` + `titleAccent` pair: splitting the
              sentence around the accent span forced every language to put the
              emphasis in English word order. Spanish rendered "Hoy es el
              ¡Sábado!", stranding the inverted exclamation mid-sentence. */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            <Trans
              i18nKey="shared.sabbath.title"
              components={{ 1: <span className="text-brand" /> }}
            />
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {t('shared.sabbath.reference')}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {t('shared.sabbath.verse')}{' '}
              <b className="text-destructive">
                {t('shared.sabbath.verseEmphasis')}
              </b>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              {t('shared.sabbath.quote')}
            </p>
            {/* A person's name — never translated, per the do-not-translate
                list in kb/01-glossary.md. */}
            <p className="text-sm font-bold text-right text-muted-foreground">
              - Dag Heward-Mills
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sabbath
