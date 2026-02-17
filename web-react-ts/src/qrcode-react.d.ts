declare module 'qrcode.react' {
  import * as React from 'react'

  export type QRCodeCanvasProps = {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    includeMargin?: boolean
  }

  export const QRCodeCanvas: React.FC<QRCodeCanvasProps>
}
