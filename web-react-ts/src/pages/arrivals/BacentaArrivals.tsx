import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useEffect } from 'react'
import { useContext } from 'react'
import { BACENTA_ARRIVALS } from './arrivalsQueries'
import { useNavigate } from 'react-router'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import { ArrowDown } from 'lucide-react'
import {
  beforeArrivalDeadline,
  beforeMobilisationDeadline,
} from './arrivals-utils'
import { getTodayTime, isToday } from 'jd-date-utils'
import HeadingSecondary from 'components/HeadingSecondary'
import { MemberContext } from 'contexts/MemberContext'
import { BacentaWithArrivals } from './arrivals-types'
import useModal from 'hooks/useModal'
import './Arrivals.css'
import CountdownTimer from './countdown-component/CountdownTimer'
import VehicleButton from './components/VehicleButton'
import ErrorText from 'components/ErrorText'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardFooter } from 'components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from 'components/ui/dialog'

const BacentaArrivals = () => {
  const { clickCard, bacentaId } = useContext(ChurchContext)
  const { show, handleClose } = useModal()
  const { theme } = useContext(MemberContext)
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error, refetch } = useQuery(BACENTA_ARRIVALS, {
    variables: { id: bacentaId, date: today },
  })

  const bacenta: BacentaWithArrivals = data?.bacentas[0]
  const date = data?.timeGraphs[0]

  const isMomoCleared = (bacenta: BacentaWithArrivals) => {
    if (bacenta?.sprinterTopUp || bacenta?.urvanTopUp) {
      if (bacenta?.momoNumber) {
        return true
      }
      return false
    }
    return true
  }

  const bussing = bacenta?.bussing.find((bussingRecord) =>
    isToday(bussingRecord.serviceDate.date.toString())
  )

  const canFillOnTheWay = () => {
    // Ring true if it is before the deadline
    // and there is a mobilisation picture
    // and there are no bussing pictures already
    if (!bussing) {
      return false
    }

    return (
      beforeArrivalDeadline(bussing, bacenta) &&
      bussing?.mobilisationPicture &&
      !bussing?.leaderDeclaration
    )
  }

  const canFillOnTheWayValue = canFillOnTheWay()
  const isBeforeArrivalEnd = bussing
    ? beforeArrivalDeadline(bussing, bacenta)
    : false

  useEffect(() => handleClose(), [])

  const END_TIME_IN_MS = new Date(
    getTodayTime(bacenta?.stream.arrivalEndTime)
  ).getTime()

  const dateTimeToEnd = END_TIME_IN_MS

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error}>
        <div>
          <HeadingPrimary loading={loading}>
            {bacenta?.name} Arrivals
          </HeadingPrimary>
          {date?.swell && (
            <HeadingSecondary loading={loading}>
              <h4 className="fw-bold text-center yellow">Swollen Weekend!!!</h4>
            </HeadingSecondary>
          )}

          {isBeforeArrivalEnd ? (
            <Card className="text-center py-4">
              <div className="text-secondary-custom">
                <span>Code of the Day: </span>
                <h5 className="fw-bold code-of-the-day">{`${bacenta?.arrivalsCodeOfTheDay}`}</h5>
              </div>

              <CountdownTimer targetDate={dateTimeToEnd} />
              <div className="text-secondary-custom">Till Arrivals Closes</div>
            </Card>
          ) : (
            <Card className="text-center py-4">
              {!bussing?.leaderDeclaration && (
                <div className="text-secondary-custom">
                  <span>Code of the Day: </span>
                  <h5 className="fw-bold code-of-the-day">{`${bacenta?.arrivalsCodeOfTheDay}`}</h5>
                </div>
              )}
            </Card>
          )}
          {!isBeforeArrivalEnd &&
            bussing?.mobilisationPicture &&
            !bussing?.leaderDeclaration && (
              <Card className="text-center py-3">
                <p className="display-1">😞</p>
                <h5 className="countdown danger fw-bold ">
                  It is too late to fill your forms!
                </h5>
                <i>
                  <div>Ecclesiastes 3:1</div>
                  <div>
                    To every thing there is a season, and a time to every
                    purpose under the heaven:
                  </div>
                </i>
              </Card>
            )}
          {bussing?.leaderDeclaration && (
            <Card className="text-center">
              <CardContent>You have filled your forms today</CardContent>
              <CardFooter>
                Click <span className="good">{`Today's Bussing`}</span> below to
                view your bussing data{' '}
                <div className="p-2">
                  <ArrowDown size={50} />
                </div>
              </CardFooter>
            </Card>
          )}

          <div className="d-grid gap-2 mt-5">
            {!isMomoCleared(bacenta) && (
              <>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => navigate('/bacenta/editbussing')}
                >
                  Please update your payment details
                </Button>
                <p className="text-center fw-bold">
                  You will need this to fill your forms
                </p>
              </>
            )}
            <Button
              className={`btn-graphs ${theme}`}
              onClick={() => navigate(`/bacenta/graphs`)}
            >
              View Last 4 Weeks
            </Button>
            <Dialog open={show} onOpenChange={(open) => { if (!open) handleClose() }}>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>You Are Too Late! 😞 </DialogTitle>
              </DialogHeader>
              
                To everything there is a time and a season, and your time is up!{' '}
                <div className="fw-bold text-center display-6 mt-2">
                  It is too late to fill your forms.
                </div>
              
              <DialogFooter>
                <Button variant="secondary" onClick={handleClose}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent></Dialog>
            <Button
              variant="default"
              size="lg"
              disabled={
                !beforeMobilisationDeadline(bacenta, bussing) ||
                !isMomoCleared(bacenta)
              }
              onClick={() => {
                clickCard(bacenta)
                clickCard(bussing)
                navigate('/arrivals/submit-mobilisation-picture')
              }}
            >
              Upload Pre-Mobilisation Picture
            </Button>
            {(!beforeMobilisationDeadline(bacenta, bussing) ||
              !isMomoCleared(bacenta)) &&
            bussing ? (
              <ErrorText>Pre-Mobilisation Form is not open!</ErrorText>
            ) : null}

            {bussing?.vehicleRecords.length ? (
              <div className="my-2">Please Find Your Records Below</div>
            ) : null}
            {bussing?.vehicleRecords.map((vehicleRecord, index) => (
              <VehicleButton
                record={vehicleRecord}
                key={index}
                canFillOnTheWay={!canFillOnTheWayValue ? false : null}
              />
            ))}
            <hr />
            <small className="yellow fw-bold">
              You must fill one form for each vehicle
            </small>
            <Button
              variant="destructive"
              size="lg"
              disabled={!canFillOnTheWayValue}
              onClick={() => {
                clickCard(bacenta)
                clickCard(bussing)

                navigate('/arrivals/submit-vehicle-record')
              }}
            >
              Add A Vehicle
            </Button>
            {bussing && (
              <Button
                variant="default"
                size="lg"
                onClick={() => {
                  clickCard(bacenta)
                  clickCard(bussing)
                  navigate('/bacenta/bussing-details')
                }}
              >
                {`Today's Bussing Summary`}
              </Button>
            )}
          </div>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentaArrivals
