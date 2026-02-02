import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import Popup from 'components/Popup/Popup'
import { ChurchLevelLower } from 'global-types'
import usePopup from 'hooks/usePopup'
import ManualApprovalSteps from 'pages/services/banking/self-banking/ManualApprovalSteps'
import { useEffect, useState } from 'react'
import { Button, Col, Container, Row, Spinner } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

const ConfirmPaymentDelay = ({
  churchLevel,
}: {
  churchLevel: ChurchLevelLower
}) => {
  const { togglePopup, isOpen } = usePopup()
  const router = useRouter()
  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    countdown > 0 && setTimeout(() => setCountdown(countdown - 1), 1000)
  }, [countdown, setCountdown])

  return (
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
            {countdown > 0 ? (
              <div>{`Confirm in ${countdown}`}</div>
            ) : (
              <div className="text-secondary" onClick={() => togglePopup()}>
                <u>Prompt not received?</u>
              </div>
            )}
            <Button
              disabled={countdown > 0}
              onClick={() =>
                router.push(`/download-reports/${churchLevel}/purchase-history`)
              }
            >
              Confirm Transaction
            </Button>
            {isOpen && (
              <Popup handleClose={togglePopup}>
                <ManualApprovalSteps close={togglePopup} />
              </Popup>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default ConfirmPaymentDelay
