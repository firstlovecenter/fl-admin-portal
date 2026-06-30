import { useContext, useState } from 'react'
import { useMutation } from '@apollo/client'
import { Archive, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { displayError, isPermissionError } from 'utils/errorHandler'

type CloseDownBacentaButtonProps = {
  bacentaId: string
  bacentaName: string
  leaderId: string
}

const CloseDownBacentaButton = ({
  bacentaId,
  bacentaName,
  leaderId,
}: CloseDownBacentaButtonProps) => {
  const navigate = useNavigate()
  const { clickCard, governorshipId } = useContext(ChurchContext)
  const [open, setOpen] = useState(false)
  const [CloseDownBacenta, { loading }] = useMutation(MAKE_BACENTA_INACTIVE, {
    refetchQueries: governorshipId
      ? [{ query: DISPLAY_GOVERNORSHIP, variables: { id: governorshipId } }]
      : [],
  })

  const handleConfirm = async () => {
    try {
      const res = await CloseDownBacenta({
        variables: { id: bacentaId, leaderId },
      })
      if (!res.data?.CloseDownBacenta) {
        throw res.errors?.[0] ?? new Error('Unable to close down bacenta')
      }
      clickCard(res.data.CloseDownBacenta)
      setOpen(false)
      navigate('/bacenta/displayall')
    } catch (error) {
      if (!isPermissionError(error)) {
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
        aria-label={`Close Down ${bacentaName}`}
        className="gap-1.5 min-h-[44px] min-w-[44px] px-2.5 sm:px-4 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Archive className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Close Down</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close Down Bacenta</DialogTitle>
            <DialogDescription>
              Are you sure you want to close down {bacentaName}? This will mark
              the bacenta inactive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              No, take me back
            </Button>
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
                  Submitting
                </>
              ) : (
                "Yes, I'm sure"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CloseDownBacentaButton
