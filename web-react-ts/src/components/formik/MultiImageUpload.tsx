import React, { useState } from 'react'
import { ErrorMessage } from 'formik'
import { useMutation } from '@apollo/client'
import { MoonLoader } from 'react-spinners'
import { uploadToS3 } from 'utils/s3Upload'
import { Button } from 'components/ui/button'
import TextError from './TextError/TextError'
import './Formik.css'
import { FormikComponentProps } from './formik-types'
import { GENERATE_PRESIGNED_URL } from './ImageUploadGQL'

interface ImageUploadProps extends FormikComponentProps {
  initialValue?: string
  setFieldValue: (field: string, value: any) => void
}

const MultiImageUpload = (props: ImageUploadProps) => {
  const { label, name, initialValue, setFieldValue, placeholder, ...rest } =
    props
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadError, setUploadError] = useState('')

  const [generatePresignedUrl] = useMutation(GENERATE_PRESIGNED_URL)

  const uploadImage = async (e: any) => {
    const chosenImages = Array.prototype.slice.call(e.target.files)
    handleUploadImages(chosenImages)
  }

  const handleUploadImages = async (files: File[]) => {
    if (!files || files.length === 0) return

    try {
      setLoading(true)
      setUploadError('')

      const uploaded: string[] = [...uploadedImages]

      for (const file of files) {
        const imageUrl = await uploadToS3({
          file,
          generatePresignedUrl,
        })
        uploaded.push(imageUrl)
      }

      setUploadedImages(uploaded)
      setFieldValue(`${name}`, uploaded)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload images'
      setUploadError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {label ? (
        <label className="label" htmlFor={name}>
          {label}
        </label>
      ) : null}
      {loading && (
        <div className="img-container mx-auto my-3 flex items-center justify-center rounded-md border border-border">
          <MoonLoader color="gray" />
        </div>
      )}

      <div className="mx-auto mb-4 w-3/4 max-w-screen-md">
        {!uploadedImages.length && !initialValue && !loading && (
          <p className="img-container mx-auto my-3 rounded-md border border-border" />
        )}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((image, index) => (
              <div className="shrink-0" key={index}>
                {(image || initialValue) && !loading && (
                  <div className="img-container flex items-center justify-center text-center">
                    <img
                      src={image || initialValue}
                      className="img-preview"
                      alt="on stage attendance"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="block w-full text-center">
        <input
          className="hidden"
          type="file"
          accept="image/png, image/webp, image/jpg, image/jpeg"
          onChange={(e) => uploadImage(e)}
          multiple
          {...rest}
        />

        <Button asChild className="image px-8 cursor-pointer">
          <span>{placeholder}</span>
        </Button>
      </label>
      {uploadError && <TextError>{uploadError}</TextError>}
      {!uploadError &&
        (props.error ? (
          <TextError>{props.error}</TextError>
        ) : (
          <ErrorMessage name={name} component={TextError} />
        ))}
    </>
  )
}

export default MultiImageUpload
