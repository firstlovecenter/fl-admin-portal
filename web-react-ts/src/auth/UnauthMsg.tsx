import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from 'components/ui/button'

export const UnauthMsg = () => {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
        You don&apos;t have access to this page
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your account doesn&apos;t have the permissions needed to view this
        page. If you think this is a mistake, contact your church admin.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Go back to the dashboard</Link>
      </Button>
    </div>
  )
}
