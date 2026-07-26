import { useMutation } from '@apollo/client'
import RoleView from 'auth/RoleView'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { alertSuccess, throwToSentry } from 'global-utils'
import { formatChurchLevel } from 'lib/scope-display'
import { permitLeaderAdmin } from 'permission-utils'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Phone, RotateCcw } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from 'components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'components/ui/alert-dialog'
import { MemberContext } from 'contexts/MemberContext'
import { UNDO_CANCELLED_SERVICE } from '../record-service/RecordServiceMutations'
import {
  BacentaWithDefaulters,
  StreamWithDefaulters,
} from './defaulters-types'
import './Defaulters.css'

type DefaulterCardProps = {
  defaulter: BacentaWithDefaulters | StreamWithDefaulters
  link?: string
}

const DefaulterCard = ({ defaulter, link }: DefaulterCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const [UndoCancelledService] = useMutation(UNDO_CANCELLED_SERVICE)

  let serviceDetails: any

  if ('services' in defaulter && defaulter.services?.length) {
    serviceDetails = defaulter.services[0]
  }

  const typeLabel = formatChurchLevel(defaulter?.__typename, t)

  return (
    <Card>
      <PlaceholderCustom
        loading={!defaulter?.name}
        className="large-number pb-3 font-bold"
      >
        <CardHeader
          onClick={() => {
            clickCard(defaulter)
            navigate(`/${defaulter?.__typename.toLowerCase()}/displaydetails`)
          }}
          className="cursor-pointer font-bold"
        >
          {`${defaulter?.name} ${typeLabel}`}
          <br />

          {defaulter?.__typename === 'Bacenta' &&
            defaulter?.governorship?.name && (
              <span className="text-muted-foreground">
                {`${defaulter?.governorship?.name} ${formatChurchLevel(
                  defaulter?.governorship?.__typename,
                  t
                )}`}
              </span>
            )}

          {defaulter?.__typename === 'Stream' && defaulter?.campus && (
            <span className="text-muted-foreground">
              {`${defaulter?.campus?.name} ${formatChurchLevel(
                defaulter?.campus?.__typename,
                t
              )}`}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div
            role="button"
            tabIndex={0}
            className="cursor-pointer text-sm"
            onClick={() => {
              clickCard(defaulter)
              clickCard(serviceDetails)
              navigate(
                link ||
                  `/${defaulter?.__typename.toLowerCase()}/displaydetails`
              )
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                clickCard(defaulter)
                clickCard(serviceDetails)
                navigate(
                  link ||
                    `/${defaulter?.__typename.toLowerCase()}/displaydetails`
                )
              }
            }}
          >
            {defaulter?.leader?.fullName || t('services.defaulters.noLeader')}
            {serviceDetails?.attendance && (
              <div>
                <span className="text-muted-foreground">
                  {t('services.defaulters.attendanceColon')}
                </span>
                {serviceDetails?.attendance}
              </div>
            )}
            {serviceDetails?.income && (
              <div>
                <span className="text-muted-foreground">
                  {t('services.defaulters.incomeColon')}
                </span>
                {currentUser.currency} {serviceDetails?.income}
              </div>
            )}
            {serviceDetails?.noServiceReason && (
              <div>
                <span className="text-muted-foreground">
                  {t('services.defaulters.reasonCancelled')}
                </span>
                {serviceDetails?.noServiceReason}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <a href={`tel:${defaulter?.leader?.phoneNumber}`}>
                <Phone className="h-4 w-4" /> {t('services.defaulters.call')}
              </a>
            </Button>
            <Button
              asChild
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
            >
              <a
                href={`whatsapp://send?phone=${defaulter?.leader?.whatsappNumber}`}
              >
                <FaWhatsapp className="h-4 w-4" />{' '}
                {t('services.defaulters.whatsapp')}
              </a>
            </Button>
            {serviceDetails?.noServiceReason && (
              <RoleView roles={permitLeaderAdmin('Governorship')}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-[hsl(var(--warning))] text-white hover:bg-[hsl(var(--warning))]/90">
                      <RotateCcw className="h-4 w-4" />{' '}
                      {t('services.defaulters.undo')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('services.defaulters.undoCancelledTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('services.defaulters.undoCancelledBody')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="min-h-11">
                        {t('shared.actions.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="min-h-11"
                        onClick={async (event) => {
                          event.preventDefault()
                          try {
                            await UndoCancelledService({
                              variables: { serviceRecordId: serviceDetails.id },
                            })
                            alertSuccess(t('services.defaulters.undoSuccess'))
                            clickCard(defaulter)
                            navigate(
                              `/${defaulter?.__typename.toLowerCase()}/displaydetails`
                            )
                          } catch (error) {
                            throwToSentry(
                              t('services.defaulters.undoErrorSentry'),
                              error
                            )
                          }
                        }}
                      >
                        {t('services.defaulters.undo')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </RoleView>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-muted-foreground">
          {t('services.defaulters.meetingDayColon', {
            day: defaulter?.meetingDay?.day,
          })}
        </CardFooter>
      </PlaceholderCustom>
    </Card>
  )
}

export default DefaulterCard
