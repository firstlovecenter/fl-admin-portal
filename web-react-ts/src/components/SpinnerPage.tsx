import React from 'react'
import { PacmanLoader } from 'react-spinners'

const SpinnerPage = () => {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-10">
      <PacmanLoader color="hsl(var(--muted-foreground))" />
    </div>
  )
}

export default SpinnerPage
