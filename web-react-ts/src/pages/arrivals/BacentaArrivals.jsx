import { useQuery } from '@apollo/client'
import BaseComponent from 'components/base-component/BaseComponent'
import React from 'react'
import { useContext } from 'react'
import { Button, Card, Container } from 'react-bootstrap'
import { BACENTA_ARRIVALS } from './arrivalsQueries'
import { useNavigate } from 'react-router'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import { CheckCircleFill } from 'react-bootstrap-icons'
import {
  beforeArrivalDeadline,
  beforeMobilisationDeadline,
} from './arrivals-utils'
import { isToday } from 'jd-date-utils'
import HeadingSecondary from 'components/HeadingSecondary'
import { MemberContext } from 'contexts/MemberContext'

const BacentaArrivals = () => {
  const { clickCard, bacentaId } = useContext(ChurchContext)
  const { theme } = useContext(MemberContext)
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error } = useQuery(BACENTA_ARRIVALS, {
    variables: { id: bacentaId, date: today },
  })

  const bacenta = data?.bacentas[0]
  const date = data?.timeGraphs[0]

  let bussing

  const isMomoCleared = (bacenta) => {
    if (bacenta?.normalBussingTopUp || bacenta?.swellBussingTopUp) {
      if (bacenta?.momoNumber) {
        return true
      }
      return false
    }
    return true
  }

  data?.bacentas[0].bussing.forEach((data) => {
    if (isToday(data.serviceDate.date)) {
      bussing = data
    }
    return null
  })

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
      !bussing?.bussingPictures?.length
    )
  }

  return (
    <BaseComponent data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary loading={loading}>
          {bacenta?.name} Arrivals
        </HeadingPrimary>
        {date?.swell && (
          <HeadingSecondary loading={loading}>
            <h3 className="fw-bold text-center yellow">Swell Weekend!!!</h3>
          </HeadingSecondary>
        )}
        <div className="text-center text-seconday">
          <p>Code of the Day: </p>
          <h4 className="fw-bold">{`${bacenta?.arrivalsCodeOfTheDay}`}</h4>
        </div>

        <div className="d-grid gap-2 mt-5">
          {!isMomoCleared(bacenta) && (
            <>
              <Button
                variant="danger"
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
            View Graphs
          </Button>
          <Button
            variant="primary"
            size="lg"
            disabled={
              !beforeMobilisationDeadline(bussing, bacenta) ||
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

          <Button
            variant="primary"
            size="lg"
            disabled={!canFillOnTheWay()}
            onClick={() => {
              clickCard(bacenta)
              clickCard(bussing)
              navigate('/arrivals/submit-on-the-way')
            }}
          >
            Submit On-The-Way Picture
          </Button>
          {bussing && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                clickCard(bacenta)
                clickCard(bussing)
                navigate('/bacenta/bussing-details')
              }}
            >
              {`Today's Bussing`}
            </Button>
          )}

          {bussing?.arrivalTime && (
            <Card>
              <Card.Body className="text-center">
                <span className="text-success fw-bold">
                  <CheckCircleFill color="green" size={35} /> Arrived!
                </span>
              </Card.Body>
            </Card>
          )}
        </div>
      </Container>
    </BaseComponent>
  )
}

export default BacentaArrivals
