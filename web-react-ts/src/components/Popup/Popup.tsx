'use client'

import React from 'react'
import './Popup.css'

type PopupProps = {
  children: React.ReactNode
  handleClose: () => void
}

const Popup = (props: PopupProps) => {
  return (
    <div className="popup-box">
      <div className="box">
        <span className="close-icon" onClick={props.handleClose}>
          x
        </span>
        {props.children}
      </div>
    </div>
  )
}

export default Popup
