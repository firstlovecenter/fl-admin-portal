import { useEffect, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { toast } from 'sonner'
import { Trans, useTranslation } from 'react-i18next'
import { showUserReportDialog } from 'global-utils'
import useModal from 'hooks/useModal'
import { AlertTriangle, Bug, Check, Copy, RefreshCcw, Send } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'components/ui/card'
import { Button } from 'components/ui/button'
import { Alert, AlertDescription, AlertTitle } from 'components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { ScrollArea } from 'components/ui/scroll-area'

export interface ApolloError {
  name: string
  graphQLErrors: {
    message: string
    locations: {
      line: number
      column: number
    }[]
    path: (string | number)[]
    extensions: {
      code: string
      exception: {
        message: string
        stacktrace: string[]
      }
    }
  }[]
  protocolErrors: unknown[]
  clientErrors: unknown[]
  networkError: {
    name: string
    response: unknown
    statusCode: number
    result: {
      errorMessage?: string
      errors: {
        message: string
        extensions: {
          code: string
          exception: {
            stacktrace: string[]
          }
        }
      }[]
    }
  } | null
  message: string
}

export interface FirebaseError {
  code: string
  message: string
  name: string
  stack: string
}

interface ErrorScreenProps {
  error: ApolloError | Error | undefined | FirebaseError
}

type Summary = {
  code: string
  message: string
  meta?: string
}

const buildSummaries = (
  error: ApolloError | undefined,
  t: TFunction
): Summary[] => {
  if (!error) return []
  const summaries: Summary[] = []

  error.graphQLErrors?.forEach(({ message, locations, path, extensions }) => {
    summaries.push({
      code: extensions?.code ?? 'GRAPHQL_ERROR',
      message,
      meta: [
        path?.length
          ? t('shared.errorScreen.pathMeta', { path: path.join(' › ') })
          : null,
        locations?.length
          ? t('shared.errorScreen.locationMeta', {
              line: locations[0].line,
              column: locations[0].column,
            })
          : null,
      ]
        .filter(Boolean)
        .join(' • '),
    })
  })

  if (error.networkError) {
    const { networkError } = error
    if (networkError.result?.errors?.length) {
      networkError.result.errors.forEach((e) => {
        summaries.push({
          code: e.extensions?.code ?? 'NETWORK_ERROR',
          message: e.message,
        })
      })
    } else {
      summaries.push({
        code: String(networkError.statusCode ?? 'NETWORK_ERROR'),
        message:
          networkError.result?.errorMessage ??
          networkError.name ??
          t('shared.errorScreen.networkRequestFailed'),
      })
    }
  }

  return summaries
}

const ErrorScreen = ({ error }: ErrorScreenProps) => {
  const { t } = useTranslation()
  const { show, handleShow, handleClose } = useModal()
  const [copied, setCopied] = useState(false)

  const apolloError = error as ApolloError | undefined
  const payload = useMemo(() => {
    if (error instanceof Error) {
      return JSON.stringify(
        { name: error.name, message: error.message, stack: error.stack },
        null,
        2
      )
    }
    return JSON.stringify(error, null, 2)
  }, [error])

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error(t('shared.errorScreen.copyUnavailable'))
      return
    }
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
    } catch {
      toast.error(t('shared.errorScreen.copyFailed'))
    }
  }

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (!show) setCopied(false)
  }, [show])
  const { graphQLErrors, networkError } = apolloError ?? {
    graphQLErrors: undefined,
    networkError: undefined,
  }

  // SYN-178 — only dump the full error internals to the console in development.
  // In production these unconditional dumps put raw GraphQL/Neo4j error text and
  // the full networkError payload into the browser console on every render; the
  // user-facing detail already lives behind the explicit "Show details" dialog.
  if (import.meta.env.DEV) {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message, locations, path }) =>
        // eslint-disable-next-line no-console
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
            locations
          )}, Path: ${JSON.stringify(path)}`
        )
      )

    if (networkError)
      // eslint-disable-next-line no-console
      console.error(`[Network error]: ${JSON.stringify(networkError)}`)
  }

  const summaries = buildSummaries(apolloError, t)
  const headline =
    error?.message ||
    apolloError?.name ||
    t('shared.errorScreen.headlineFallback')

  return (
    <div className="flex min-h-svh items-start justify-center bg-background px-4 py-10 sm:items-center sm:py-16">
      <div className="w-full max-w-xl">
        <Card className="overflow-hidden">
          <CardHeader className="items-center gap-3 text-center">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            >
              <AlertTriangle className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">
              {t('shared.errorScreen.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('shared.errorScreen.subtitle', {
                name:
                  apolloError?.name ??
                  t('shared.errorScreen.errorFallbackName'),
              })}
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            {summaries.length > 0 ? (
              summaries.map((s, i) => (
                <Alert
                  key={`${s.code}-${i}`}
                  variant="destructive"
                  className="text-left"
                >
                  <Bug aria-hidden="true" />
                  <AlertTitle className="font-mono text-xs uppercase tracking-wide">
                    {s.code}
                  </AlertTitle>
                  <AlertDescription>
                    <p className="break-words text-sm">{s.message}</p>
                    {s.meta && (
                      <p className="text-xs text-muted-foreground">{s.meta}</p>
                    )}
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <Alert variant="destructive" className="text-left">
                <Bug aria-hidden="true" />
                <AlertTitle>{t('shared.errorScreen.unexpected')}</AlertTitle>
                <AlertDescription>
                  <p className="break-words text-sm">{headline}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t border-border bg-muted/30 p-4 sm:flex-row sm:justify-end sm:p-6">
            <Button
              variant="ghost"
              onClick={handleShow}
              className="min-h-11 w-full sm:min-h-9 sm:w-auto"
            >
              <Bug aria-hidden="true" className="h-4 w-4" />
              {t('shared.errorScreen.showDetails')}
            </Button>
            <Button
              variant="outline"
              onClick={showUserReportDialog}
              className="min-h-11 w-full sm:min-h-9 sm:w-auto"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              {t('shared.errorScreen.sendCrashReport')}
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="min-h-11 w-full sm:min-h-9 sm:w-auto"
            >
              <RefreshCcw aria-hidden="true" className="h-4 w-4" />
              {t('shared.errorScreen.reloadPage')}
            </Button>
          </CardFooter>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Trans
            i18nKey="shared.errorScreen.tip"
            components={{
              1: <span className="font-medium text-foreground" />,
            }}
          />
        </p>
      </div>

      <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {apolloError?.name ?? t('shared.errorScreen.detailsTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('shared.errorScreen.detailsDescription')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="min-w-0 max-h-[60vh] rounded-md border border-border bg-muted/40">
            <pre className="whitespace-pre-wrap [overflow-wrap:anywhere] p-4 font-mono text-xs text-foreground">
              {payload}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="min-h-11 sm:min-h-9"
            >
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4" />
              )}
              {copied ? t('shared.actions.copied') : t('shared.actions.copy')}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="min-h-11 sm:min-h-9"
            >
              {t('shared.actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ErrorScreen
