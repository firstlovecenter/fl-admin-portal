import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Button } from 'components/ui/button'

export type MemberCollision = {
  field: 'email' | 'whatsappNumber'
  status: 'active' | 'inactive'
  memberId: string
  firstName: string
  lastName: string
  bacentaName: string | null
  /** Bacenta of the member being edited — where a reactivated member is moved. */
  targetBacentaId?: string
}

type MemberCollisionDialogProps = {
  collision: MemberCollision | null
  reactivating: boolean
  onReactivate: () => void
  onClose: () => void
}

const MemberCollisionDialog = ({
  collision,
  reactivating,
  onReactivate,
  onClose,
}: MemberCollisionDialogProps) => {
  if (!collision) return null

  const who = `${collision.firstName} ${collision.lastName}`
  const fieldLabel = collision.field === 'email' ? 'email' : 'WhatsApp number'
  const isInactive = collision.status === 'inactive'

  return (
    <Dialog open={!!collision} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isInactive ? 'Deactivated member found' : 'Member already registered'}
          </DialogTitle>
          <DialogDescription>
            {isInactive ? (
              <>
                This {fieldLabel} belongs to <strong>{who}</strong>, whose profile
                is deactivated. Reactivate them and move them to this bacenta so
                you can review both records and decide what to do.
              </>
            ) : (
              <>
                This {fieldLabel} already belongs to <strong>{who}</strong>
                {collision.bacentaName ? (
                  <>
                    , a registered member at{' '}
                    <strong>{collision.bacentaName}</strong> Bacenta
                  </>
                ) : (
                  ', a registered member'
                )}
                . To bring them into this bacenta, a transfer must be requested.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={reactivating}>
            {isInactive ? 'Cancel' : 'Close'}
          </Button>
          {isInactive && (
            <Button onClick={onReactivate} disabled={reactivating}>
              {reactivating ? 'Reactivating…' : 'Reactivate member'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MemberCollisionDialog
