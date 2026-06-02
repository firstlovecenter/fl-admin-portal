import { useMutation } from '@apollo/client'
import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { buttonVariants } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import { GENERATE_PRESIGNED_URL } from 'components/formik/ImageUploadGQL'
import { uploadToS3 } from 'utils/s3Upload'

type MemberAvatarUploadProps = {
  name: string
  value: string
  initials: string
  error?: string
  setFieldValue: (field: string, value: string) => void
}

const MemberAvatarUpload = ({
  name,
  value,
  initials,
  error,
  setFieldValue,
}: MemberAvatarUploadProps) => {
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [generatePresignedUrl] = useMutation(GENERATE_PRESIGNED_URL)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setUploadError('')

    try {
      const url = await uploadToS3({ file, generatePresignedUrl })
      setFieldValue(name, url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploadError(message)
    } finally {
      setLoading(false)
    }
  }

  const showError = uploadError || error

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-4 lg:sticky lg:top-[73px]">
      <div className="relative">
        <Avatar className="h-32 w-32 ring-2 ring-border ring-offset-2 ring-offset-card">
          {value ? (
            <AvatarImage src={value} alt="Member photo" />
          ) : null}
          <AvatarFallback className="text-3xl font-semibold bg-muted">
            {initials || <Camera className="h-8 w-8 text-muted-foreground" />}
          </AvatarFallback>
        </Avatar>
        {loading && (
          <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          </div>
        )}
      </div>

      <label
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-full gap-2 min-h-[44px] cursor-pointer',
          loading && 'pointer-events-none opacity-50'
        )}
      >
        <input
          id={name}
          name={name}
          type="file"
          accept="image/png, image/webp, image/jpg, image/jpeg"
          className="sr-only"
          onChange={onFileChange}
          disabled={loading}
        />
        <Camera className="h-4 w-4" aria-hidden="true" />
        {value ? 'Change Photo' : 'Upload Photo'}
      </label>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        PNG, JPG or WebP. Max 10MB.
      </p>

      {showError && (
        <p className="text-xs text-destructive text-center" role="alert">
          {showError}
        </p>
      )}
    </div>
  )
}

export default MemberAvatarUpload
