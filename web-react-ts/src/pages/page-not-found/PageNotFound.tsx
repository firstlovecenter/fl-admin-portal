import FourOhFour from 'assets/FourOhFour'
import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'components/ui/button'

const PageNotFound = () => {
  return (
    <div className="scroll-bottom">
      <div className="py-5">
        <div className="d-flex justify-content-center ">
          <div xs={6} md={6} lg={2}>
            <FourOhFour className="img-fluid rounded" />
          </div>
        </div>
      </div>
      <div>
        <h1 className="text-center text-secondary fw-bolder">404</h1>
        <h3 className="text-center text-secondary">Page Not Found</h3>
        <div className="text-center text-secondary px-2">
          The page you are looking for does not exist. It may be under
          maintenance, or there may be some other problem.
        </div>
        <div className="text-center fixed-bottom pb-5">
          <Link to="/">
            <Button>Go back to the dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PageNotFound
