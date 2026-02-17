import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'

interface SelfieCaptureModalProps {
  show: boolean
  onHide: () => void
  onCapture: (base64Image: string) => void
}

/**
 * Modal that opens the front-facing camera and lets the user take a selfie.
 * Returns the captured image as a base64 data URL.
 */
const SelfieCaptureModal = ({
  show,
  onHide,
  onCapture,
}: SelfieCaptureModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setCapturedImage(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err: any) {
      setCameraError(
        err?.message || 'Could not access camera. Please allow camera access.'
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (show) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [show, startCamera, stopCamera])

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(dataUrl)
    stopCamera()
  }

  const retake = () => {
    setCapturedImage(null)
    startCamera()
  }

  const confirmSelfie = () => {
    if (capturedImage) {
      onCapture(capturedImage)
      onHide()
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>📸 Take a Selfie</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {cameraError && (
          <Alert variant="danger" className="small">
            {cameraError}
          </Alert>
        )}

        {!capturedImage && (
          <div className="position-relative mb-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: 320,
                borderRadius: 12,
                transform: 'scaleX(-1)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 180,
                height: 220,
                border: '2px dashed rgba(255,255,255,0.6)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {capturedImage && (
          <div className="mb-3">
            <img
              src={capturedImage}
              alt="Selfie preview"
              style={{
                width: '100%',
                maxWidth: 320,
                borderRadius: 12,
                transform: 'scaleX(-1)',
              }}
            />
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        {!capturedImage ? (
          <Button
            variant="primary"
            onClick={takeSelfie}
            disabled={!!cameraError}
          >
            📸 Capture
          </Button>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={retake}>
              🔄 Retake
            </Button>
            <Button variant="success" onClick={confirmSelfie}>
              ✅ Use This Photo
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export default SelfieCaptureModal
