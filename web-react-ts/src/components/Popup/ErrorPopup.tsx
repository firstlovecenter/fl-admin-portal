import React from 'react'
import { Button } from 'components/ui/button'
import Popup from './Popup'
import { useNavigate } from 'react-router'

interface ErrorDialogProps {
  errorMessage: string
  togglePopup: () => void
  link?: string
}

const ErrorPopup = (props: ErrorDialogProps) => {
  const { errorMessage, togglePopup, link } = props

  const navigate = useNavigate()

  const isPoimenError = errorMessage.includes('Poimen')

  return (
    <Popup handleClose={togglePopup}>
      <div>
        {!isPoimenError && (
          <p>
            Please make sure that you have enough funds in your mobile wallet,
            and try again after 30 mins - 1 hour.
          </p>
        )}

        <code className="text-white">{errorMessage}</code>
        <Button
          variant="destructive"
          type="submit"
          size="lg"
          className="w-full mt-2"
          onClick={() => {
            togglePopup()
            if (link) navigate(link)
          }}
        >
          Okay
        </Button>
      </div>
    </Popup>
  )
}

export default ErrorPopup
