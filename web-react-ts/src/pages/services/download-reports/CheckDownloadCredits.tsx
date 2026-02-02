import { Church } from 'global-types'
import React from 'react'
import { Button, Card } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

const CheckDownloadCredits = ({
  church,
  children,
}: {
  church: Church
  children: React.ReactNode
}) => {
  const router = useRouter()

  if (church?.downloadCredits <= 0 || !church?.downloadCredits) {
    return (
      <Card className="text-center" border="warning">
        <Card.Header>Notice</Card.Header>
        <Card.Body>
          <div>
            You have exhausted your download credits for {church?.name}{' '}
            {church?.__typename}
          </div>
          <Button
            onClick={() =>
              router.push(
                `/download-reports/${church.__typename.toLowerCase()}/purchase-credits`
              )
            }
          >
            Purchase More
          </Button>
        </Card.Body>
      </Card>
    )
  }

  return <>{children}</>
}

export default CheckDownloadCredits
