import { useMutation } from '@apollo/client'
import RoleView from 'auth/RoleView'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { alertMsg } from 'global-utils'
import { permitLeaderAdmin } from 'permission-utils'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { Phone, RotateCcw } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from 'components/ui/card'
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
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const [UndoCancelledService] = useMutation(UNDO_CANCELLED_SERVICE)

  let serviceDetails: any

  if ('services' in defaulter && defaulter.services?.length) {
    serviceDetails = defaulter.services[0]
  }

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
          {`${defaulter?.name} ${defaulter?.__typename}`}
          <br />

          {defaulter?.__typename === 'Bacenta' &&
            defaulter?.governorship?.name && (
              <span className="text-muted-foreground">
                {`${defaulter?.governorship?.name} ${defaulter?.governorship?.__typename}`}
              </span>
            )}

          {defaulter?.__typename === 'Stream' && defaulter?.campus && (
            <span className="text-muted-foreground">
              {`${defaulter?.campus?.name} ${defaulter?.campus?.__typename}`}
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
            {defaulter?.leader?.fullName || 'No Leader'}
            {serviceDetails?.attendance && (
              <div>
                <span className="text-muted-foreground">Attendance: </span>
                {serviceDetails?.attendance}
              </div>
            )}
            {serviceDetails?.income && (
              <div>
                <span className="text-muted-foreground">Income: </span>
                {currentUser.currency} {serviceDetails?.income}
              </div>
            )}
            {serviceDetails?.noServiceReason && (
              <div>
                <span className="text-muted-foreground">
                  Reason for Cancelled Service:{' '}
                </span>
                {serviceDetails?.noServiceReason}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <a href={`tel:${defaulter?.leader?.phoneNumber}`}>
                <Phone className="h-4 w-4" /> Call
              </a>
            </Button>
            <Button
              asChild
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
            >
              <a
                href={`whatsapp://send?phone=${defaulter?.leader?.whatsappNumber}`}
              >
                <FaWhatsapp className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
            {serviceDetails?.noServiceReason && (
              <RoleView roles={permitLeaderAdmin('Governorship')}>
                <Button
                  className="bg-[hsl(var(--warning))] text-white hover:bg-[hsl(var(--warning))]/90"
                  onClick={() => {
                    const confirmBox = window.confirm(
                      'Do you want to undo the cancellation of this service?'
                    )

                    if (confirmBox === true) {
                      UndoCancelledService({
                        variables: { serviceRecordId: serviceDetails.id },
                      }).then(() => {
                        alertMsg(
                          'Leader can now fill the form again. Thank you!'
                        )
                        clickCard(defaulter)
                        navigate(
                          `/${defaulter?.__typename.toLowerCase()}/displaydetails`
                        )
                      })
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Undo
                </Button>
              </RoleView>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-muted-foreground">{`Meeting Day: ${defaulter?.meetingDay?.day}`}</CardFooter>
      </PlaceholderCustom>
    </Card>
  )
}

export default DefaulterCard
