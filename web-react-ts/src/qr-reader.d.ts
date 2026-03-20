declare module 'react-qr-reader' {
  import * as React from 'react'

  export type QrReaderProps = {
    onResult?: (result: any, error?: any) => void
    constraints?: MediaTrackConstraints
    className?: string
  }

  export const QrReader: React.FC<QrReaderProps>
}
