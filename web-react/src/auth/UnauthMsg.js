import React from 'react'
import { useHistory } from 'react-router-dom'
import { NavBar } from '../components/nav/NavBar'

export const UnauthMsg = () => {
  const history = useHistory()

  return (
    <React.Fragment>
      <NavBar />
      <div className="container body-container">
        {/* <!--Web Logo and text--> */}
        <div className="row d-flex align-items-center justify-content-center">
          <div className="col-12 col-lg-6 justify-content-center">
            {`Heya! Looks like you're trying to view some information that is not
            meant for you. Please contact the system administrator for more
            information`}
            <div>
              {' '}
              <button
                className="btn-primary"
                onClick={() => {
                  history.goBack()
                }}
              >
                Click Here To Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
