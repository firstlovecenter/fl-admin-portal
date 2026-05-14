const Sabbath = () => {
  return (
    <div className="min-h-svh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Today is the <span className="text-brand">Sabbath!</span>
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Exodus 20:8-10
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Remember the sabbath day, to keep it holy. Six days shalt thou
              labour, and do all thy work: But the seventh day is the sabbath of
              the LORD thy God: in it{' '}
              <b className="text-destructive">thou shalt not do any work...</b>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              After you are born again, you must show your respect for God by
              honouring the Sabbath day.
            </p>
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
