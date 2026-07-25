import React from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  if (!collision) return null

  const who = `${collision.firstName} ${collision.lastName}`
  const fieldLabel =
    collision.field === 'email'
      ? t('directory.memberCollisionDialog.fieldEmail')
      : t('directory.memberCollisionDialog.fieldWhatsapp')
  const isInactive = collision.status === 'inactive'

  return (
    <Dialog open={!!collision} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isInactive
              ? t('directory.memberCollisionDialog.deactivatedTitle')
              : t('directory.memberCollisionDialog.registeredTitle')}
          </DialogTitle>
          <DialogDescription>
            {isInactive ? (
              <>
                {t('directory.memberCollisionDialog.deactivatedDescriptionPrefix', {
                  field: fieldLabel,
                })}{' '}
                <strong>{who}</strong>
                {t('directory.memberCollisionDialog.deactivatedDescriptionSuffix')}
              </>
            ) : (
              <>
                {t('directory.memberCollisionDialog.registeredDescriptionPrefix', {
                  field: fieldLabel,
                })}{' '}
                <strong>{who}</strong>
                {collision.bacentaName ? (
                  <>
                    {t(
                      'directory.memberCollisionDialog.registeredWithBacentaMiddle'
                    )}{' '}
                    <strong>{collision.bacentaName}</strong>{' '}
                    {t('shared.churchLevel.Bacenta')}
                  </>
                ) : (
                  t('directory.memberCollisionDialog.registeredWithoutBacenta')
                )}
                {t('directory.memberCollisionDialog.registeredDescriptionSuffix')}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={reactivating}>
            {isInactive
              ? t('directory.common.cancel')
              : t('directory.common.close')}
          </Button>
          {isInactive && (
            <Button onClick={onReactivate} disabled={reactivating}>
              {reactivating
                ? t('directory.memberCollisionDialog.reactivating')
                : t('directory.memberCollisionDialog.reactivateMember')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MemberCollisionDialog
