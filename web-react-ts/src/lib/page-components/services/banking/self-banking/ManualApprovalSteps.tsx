import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import React from 'react'
import { Button } from 'react-bootstrap'

type ManualApprovalStepsProps = {
  close: () => void
}

const ManualApprovalSteps = (props: ManualApprovalStepsProps) => {
  return (
    <>
      <HeadingPrimary>Manual Approval</HeadingPrimary>
      To manually approve the transaction
      <ol className="mt-3 force-left">
        <li className="text-left">Dial *170#</li>
        <li>Choose Option: 6) Wallet</li>
        <li>{`Choose Option: 3) My Approvals `}</li>
        <li>Enter your MoMo Pin to retrieve your pending approval list</li>
        <li>Choose a pending transaction</li>
        <li>Choose Option 1 to approve</li>
        <li>Tap button to continue</li>
      </ol>
      <div className="d-grid gap-2">
        <Button
          onClick={props.close}
          variant="success"
          size="lg"
          className="px-3 m3-5"
        >
          Okay!
        </Button>
      </div>
    </>
  )
}

export default ManualApprovalSteps
