import React from 'react'
import {
  Dialog,
  DialogContent,
} from 'components/ui/dialog'

type PopupProps = {
  children: React.ReactNode
  handleClose: () => void
}

const Popup = (props: PopupProps) => {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) props.handleClose() }}>
      <DialogContent>
        {props.children}
      </DialogContent>
    </Dialog>
  )
}

export default Popup
