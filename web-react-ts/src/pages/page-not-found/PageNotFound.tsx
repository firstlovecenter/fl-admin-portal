import React from 'react'
import { Link } from 'react-router-dom'
import FourOhFour from 'assets/FourOhFour'
import { Button } from 'components/ui/button'

const PageNotFound = () => {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-32 sm:w-40">
        <FourOhFour className="h-auto w-full" />
      </div>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
        404
      </h1>
      <h2 className="mt-2 text-lg font-semibold text-foreground">
        Page not found
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you are looking for does not exist. It may be under maintenance,
        or there may be some other problem.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Go back to the dashboard</Link>
      </Button>
    </div>
  )
}

export default PageNotFound
