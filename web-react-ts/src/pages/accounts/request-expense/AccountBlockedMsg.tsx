import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import React from 'react'
import { Card, CardContent } from 'components/ui/card'

const AccountBlockedMsg = () => {
  return (
    <div>
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
        <CardContent>
          <p className="fs-5">Accounts are open daily from 6am to 3pm</p>
        </CardContent>
      </Card>
      <p className="mt-2 text-end fw-bold fs-3">Thank You!</p>
    </div>
  )
}

export default AccountBlockedMsg
