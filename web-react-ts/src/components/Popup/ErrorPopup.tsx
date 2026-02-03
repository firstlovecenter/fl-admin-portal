import React from 'react'
import { Button, Container } from 'react-bootstrap'
import Popup from './Popup'
import { useRouter } from 'next/navigation'

interface ErrorDialogProps {
  errorMessage: string
  togglePopup: () => void
  link?: string
}

const ErrorPopup = (props: ErrorDialogProps) => {
  const { errorMessage, togglePopup, link } = props

  const router = useRouter()

  const isPoimenError = errorMessage.includes('Poimen')

  return (
    <Popup handleClose={togglePopup}>
      <Container>
        {!isPoimenError && (
          <p>
            Please make sure that you have enough funds in your mobile wallet,
            and try again after 30 mins - 1 hour.
          </p>
        )}

        <code className="text-white">{errorMessage}</code>
        <Button
          variant="danger"
          type="submit"
          size="lg"
          className="w-100 mt-2"
          onClick={() => {
            togglePopup()
            if (link) router.push(link)
          }}
        >
          Okay
        </Button>
      </Container>
    </Popup>
  )
}

export default ErrorPopup
