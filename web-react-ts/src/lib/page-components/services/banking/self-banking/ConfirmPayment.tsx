import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import Popup from 'components/Popup/Popup'
import { ServiceContext } from 'contexts/ServiceContext'
import usePopup from 'hooks/usePopup'
import React, { useContext, useEffect, useState } from 'react'
import { Col, Container, Row, Spinner } from 'react-bootstrap'
import { SELF_BANKING_RECEIPT } from './bankingQueries'
import ButtonConfirmPayment from './components/button/ConfirmPayment'
import './ConfirmPayment.css'
import ManualApprovalSteps from './ManualApprovalSteps'

const ConfirmPayment = () => {
  const { togglePopup, isOpen } = usePopup()
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error, refetch } = useQuery(SELF_BANKING_RECEIPT, {
    variables: { id: serviceRecordId },
  })

  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    countdown > 0 && setTimeout(() => setCountdown(countdown - 1), 1000)
  }, [countdown, setCountdown])

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container className="vertically-center d-flex align-items-center px-3 text-center">
        <Row>
          <Col>
            <Spinner animation="border" className="big-spinner" />
            <HeadingPrimary className="mt-3">Processing!</HeadingPrimary>
            <div className="mt-2">
              Your transaction is currently being processed. Please wait for the
              prompt to authorize the transaction
            </div>
            <div className="d-grid gap-2">
              <ButtonConfirmPayment
                refetch={refetch}
                disabled={countdown > 0}
                service={{
                  id: serviceRecordId,
                }}
              />

              {countdown > 0 ? (
                <div>{`Confirm in ${countdown}`}</div>
              ) : (
                <div className="text-secondary" onClick={() => togglePopup()}>
                  <u>Prompt not received?</u>
                </div>
              )}

              {isOpen && (
                <Popup handleClose={togglePopup}>
                  <ManualApprovalSteps close={togglePopup} />
                </Popup>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </ApolloWrapper>
  )
}

export default ConfirmPayment
