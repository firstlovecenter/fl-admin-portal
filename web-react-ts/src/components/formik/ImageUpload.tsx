import React, { useRef, useState } from 'react'
import { ErrorMessage } from 'formik'
import { useMutation } from '@apollo/client'
import { Camera, Loader2, RefreshCw } from 'lucide-react'
import TextError from './TextError/TextError'
import { FormikComponentProps } from './formik-types'
import { uploadToS3 } from 'utils/s3Upload'
import { GENERATE_PRESIGNED_URL } from './ImageUploadGQL'
import { cn } from 'components/lib/utils'

interface ImageUploadProps extends FormikComponentProps {
  initialValue?: string
  setFieldValue: (field: string, value: string) => void
}

const ImageUpload = (props: ImageUploadProps) => {
  const {
    label,
    name,
    initialValue,
    setFieldValue,
    placeholder,
    // strip Formik-internal props that must not reach the native <input>
    component: _component,
    as: _as,
    render: _render,
    children: _children,
    validate: _validate,
    innerRef: _innerRef,
    error,
    options: _options,
    ...inputRest
  } = props as ImageUploadProps & {
    component?: unknown
    as?: unknown
    render?: unknown
    children?: unknown
    validate?: unknown
    innerRef?: unknown
    options?: unknown
  }

  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [generatePresignedUrl] = useMutation(GENERATE_PRESIGNED_URL)

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setUploadError('')
      const imageUrl = await uploadToS3({ file, generatePresignedUrl })
      setImage(imageUrl)
      setFieldValue(name, imageUrl)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Upload failed:', err)
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload image'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleZoneActivate = () => inputRef.current?.click()
  const handleZoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const hasImage = !!(image || initialValue)
  const previewSrc = image || initialValue || ''

  return (
    <div className="space-y-2">
      {label && (
        <label
          id={`${name}-label`}
          htmlFor={name}
          className="text-sm font-medium leading-none text-foreground"
        >
          {label}
        </label>
      )}

      {/* Drop zone — div, not label, to avoid duplicate htmlFor association */}
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={label ? `${name}-label` : undefined}
        aria-label={!label ? (placeholder ?? 'Upload a photo') : undefined}
        onClick={handleZoneActivate}
        onKeyDown={handleZoneKeyDown}
        className={cn(
          'group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors',
          hasImage || loading
            ? 'border-border'
            : 'border-border hover:border-primary hover:bg-muted/30 active:bg-muted/50',
          hasImage && !loading ? 'h-60' : 'min-h-[240px]'
        )}
      >
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="file"
          accept="image/png, image/webp, image/jpg, image/jpeg"
          className="sr-only"
          onChange={uploadImage}
          {...inputRest}
        />

        {loading && (
          <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading…</p>
          </div>
        )}

        {hasImage && !loading && (
          <>
            <img
              src={previewSrc}
              alt="Upload preview"
              className="h-full w-full object-cover"
            />
            {/* Always-visible overlay at rest so touch users see the re-upload affordance */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-60 transition-opacity hover:opacity-100 active:opacity-100">
              <RefreshCw className="size-6 text-white" />
              <p className="text-sm font-semibold text-white">Change Photo</p>
            </div>
          </>
        )}

        {!hasImage && !loading && (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Camera className="size-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {placeholder ?? 'Upload a photo'}
              </p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP</p>
            </div>
          </div>
        )}
      </div>

      {uploadError && <TextError>{uploadError}</TextError>}
      {!uploadError &&
        (error ? (
          <TextError>{error}</TextError>
        ) : (
          <ErrorMessage name={name} component={TextError} />
        ))}
    </div>
  )
}

export default ImageUpload
