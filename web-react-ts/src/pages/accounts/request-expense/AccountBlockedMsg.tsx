import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import React from 'react'
import { Card, Container } from 'react-bootstrap'

const AccountBlockedMsg = () => {
  return (
    <Container>
      <HeadingPrimary className="text-danger">
        Account Is Locked!
      </HeadingPrimary>
      <div className="font-primary">
        <p className="fs-6 mt-5">
          If you are seeing this, it means that you are trying to request
          expenses at a time when you shouldn't be doing so.
        </p>

        <p className="mb-5">Please try on any of the following days:</p>
      </div>
      <Card>
        <Card.Body>
          <p className="fs-5">Sunday 6am - Thursday 10am</p>
        </Card.Body>
      </Card>
      <p className="mt-2 text-end fw-bold fs-3">Thank You!</p>
    </Container>
  )
}

export default AccountBlockedMsg
