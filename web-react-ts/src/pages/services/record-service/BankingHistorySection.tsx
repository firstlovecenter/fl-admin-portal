import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from 'components/ui/accordion'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { BankingHistoryLog } from 'global-types'
import { parseDate, parseNeoTime } from 'jd-date-utils'
import { History } from 'lucide-react'

const METHOD_LABEL: Record<BankingHistoryLog['method'], string> = {
  self: 'Self-banking',
  recovery: 'Admin recovery',
  webhook: 'Paystack webhook',
  slip: 'Banking slip',
  teller: 'Teller',
}

const METHOD_TONE: Record<BankingHistoryLog['method'], string> = {
  self: 'border-banking/50 text-banking',
  recovery: 'border-warning/50 text-warning',
  webhook: 'border-banking/50 text-banking',
  slip: 'border-primary/50 text-primary',
  teller: 'border-accent/50 text-accent-foreground',
}

const TERMINAL_SUCCESS = new Set([
  'success',
  'slip-uploaded',
  'teller-confirmed',
])

function statusTone(toStatus: string): string {
  if (TERMINAL_SUCCESS.has(toStatus)) return 'text-banking'
  if (toStatus === 'reversed' || toStatus === 'failed' || toStatus === 'abandoned')
    return 'text-destructive'
  return 'text-warning'
}

type Props = {
  bankingHistory?: BankingHistoryLog[]
}

const BankingHistorySection = ({ bankingHistory }: Props) => {
  if (!bankingHistory || bankingHistory.length === 0) return null

  // Newest first.
  const ordered = [...bankingHistory].sort((a, b) =>
    a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0
  )

  return (
    <Card>
      <CardContent className="p-0">
        <Accordion type="single" collapsible defaultValue="banking-history">
          <AccordionItem value="banking-history" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <History className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Banking history
                </span>
                <Badge variant="secondary" className="ml-1">
                  {ordered.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ol className="space-y-3">
                {ordered.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-md border border-border bg-card px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`min-w-[7rem] justify-center ${METHOD_TONE[log.method]}`}
                      >
                        {METHOD_LABEL[log.method] ?? log.method}
                      </Badge>
                      <span
                        className={`font-mono text-xs ${statusTone(log.toStatus)}`}
                      >
                        {log.fromStatus ? `${log.fromStatus} → ` : ''}
                        {log.toStatus}
                      </span>
                    </div>
                    {log.message && (
                      <p className="mt-1 text-sm text-foreground">
                        {log.message}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>
                        {parseDate(log.ts)} at {parseNeoTime(log.ts)}
                      </span>
                      {log.loggedBy?.fullName && (
                        <span>by {log.loggedBy.fullName}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default BankingHistorySection
