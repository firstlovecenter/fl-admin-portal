import React from 'react'
import { Button, Container } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import MenAtWork from 'assets/men-at-work-shivendu-shukla.webp'
import './UnauthMsg.css'

export const UnauthMsg = () => {
  const router = useRouter()

  return (
    <div className="bg-img" style={{ backgroundImage: `url(${MenAtWork})` }}>
      <Container className="message text-center">
        {/* <!--Web Logo and text--> */}

        {`Sorry! There was an error trying to view this page, but we are working on it!`}
        <div className="pt-3">
          <Button
            variant="dark"
            size="lg"
            onClick={() => {
              router.push('/')
            }}
          >
            Click Here To Go Home
          </Button>
        </div>
      </Container>
    </div>
  )
}
