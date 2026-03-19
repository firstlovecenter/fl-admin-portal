declare module 'qrcode.react' {
  import { CSSProperties, SVGProps, CanvasHTMLAttributes } from 'react'

  interface QRProps {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    bgColor?: string
    fgColor?: string
    includeMargin?: boolean
    imageSettings?: {
      src: string
      height?: number
      width?: number
      excavate?: boolean
      x?: number
      y?: number
    }
    style?: CSSProperties
  }

  interface QRCodeCanvasProps extends QRProps, CanvasHTMLAttributes<HTMLCanvasElement> {}
  interface QRCodeSVGProps extends QRProps, SVGProps<SVGSVGElement> {}
  interface QRCodeProps extends QRProps {
    renderAs?: 'canvas' | 'svg'
  }

  export function QRCodeCanvas(props: QRCodeCanvasProps): JSX.Element
  export function QRCodeSVG(props: QRCodeSVGProps): JSX.Element
  export default function QRCode(props: QRCodeProps): JSX.Element
}
