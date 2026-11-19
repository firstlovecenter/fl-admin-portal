import { useTranslation } from 'react-i18next'
import { useContext, useState } from 'react'
import { useMutation } from '@apollo/client'
import { Archive, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_BACENTA_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { DISPLAY_GOVERNORSHIP } from 'pages/directory/display/ReadQueries'
import { throwToSentry } from 'global-utils'
import { CALLER_HANDLES_ERRORS_CONTEXT } from 'lib/createApolloClient'
import {
  displayError,
  isPermissionError,
  isUserInputError,
} from 'utils/errorHandler'

type CloseDownBacentaButtonProps = {
  bacentaId: string
  bacentaName: string
  leaderId: string
  memberCount?: number
}

const CloseDownBacentaButton = ({
  bacentaId,
  bacentaName,
  leaderId,
  memberCount = 0,
}: CloseDownBacentaButtonProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clickCard, governorshipId } = useContext(ChurchContext)
  const [open, setOpen] = useState(false)
  // SYN-233 — don't send a close-down the server will reject: explain the
  // member transfer instead. The server guard stays authoritative (the count
  // can be stale, or 0 for roles that can't see it).
  const hasMembers = memberCount > 0
  const [CloseDownBacenta, { loading }] = useMutation(MAKE_BACENTA_INACTIVE, {
    refetchQueries: governorshipId
      ? [{ query: DISPLAY_GOVERNORSHIP, variables: { id: governorshipId } }]
      : [],
  })

  const handleConfirm = async () => {
    try {
      const res = await CloseDownBacenta({
        variables: { id: bacentaId, leaderId },
        // displayError below shows the server's reason; without this the
        // error link stacks a generic "Something went wrong" on top of it.
        context: CALLER_HANDLES_ERRORS_CONTEXT,
      })
      if (!res.data?.CloseDownBacenta) {
        throw res.errors?.[0] ?? new Error('Unable to close down bacenta')
      }
      clickCard(res.data.CloseDownBacenta)
      setOpen(false)
      navigate('/bacenta/displayall')
    } catch (error) {
      // A BAD_USER_INPUT rejection (members left, unbanked offering) is the
      // user's to fix, so displayError alone explains it; throwToSentry would
      // add a second toast and report it as a fault.
      if (!isPermissionError(error) && !isUserInputError(error)) {
        throwToSentry('There was an error closing down this bacenta', error)
      }
      displayError('Unable to close down bacenta', error)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={t('directory.closeDown.confirm', { name: bacentaName })}
        className="gap-1.5 min-h-[44px] min-w-[44px] px-2.5 sm:px-4 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Archive className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {t('directory.closeDown.button')}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('directory.closeDown.title')}</DialogTitle>
            <DialogDescription>
              {hasMembers
                ? t('directory.closeDown.hasMembers', {
                    name: bacentaName,
                    count: memberCount,
                  })
                : t('directory.closeDown.description', { name: bacentaName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              {t('directory.closeDown.cancel')}
            </Button>
            {hasMembers ? (
              <Button asChild className="min-h-[44px]">
                <Link to="/bacenta/members">
                  {t('directory.closeDown.viewMembers')}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                disabled={loading}
                onClick={handleConfirm}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('shared.form.submitting')}
                  </>
                ) : (
                  t('directory.closeDown.yes')
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CloseDownBacentaButton
