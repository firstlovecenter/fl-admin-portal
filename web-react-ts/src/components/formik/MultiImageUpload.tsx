import React, { useState } from 'react'
import { ErrorMessage } from 'formik'
import { useMutation } from '@apollo/client'
import TextError from './TextError/TextError'
import { Container } from 'react-bootstrap'
import './Formik.css'
import { FormikComponentProps } from './formik-types'
import { MoonLoader } from 'react-spinners'
import { uploadToS3 } from 'utils/s3Upload'
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
      setUploadError('') // Clear any previous errors

      const uploaded: string[] = [...uploadedImages]

      // Upload all files to S3
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
      // eslint-disable-next-line no-console
      console.error('Upload failed:', error)

      // Set user-friendly error message
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
        <Container className="my-3 img-container d-flex justify-content-center align-items-center border">
          <MoonLoader color="gray" />
        </Container>
      )}

      <div className="container mb-4 card-button-row vw-75">
        <table>
          <tbody>
            <tr>
              {!uploadedImages.length && !initialValue && !loading && (
                <p className="text-center img-container border my-3"></p>
              )}
              {uploadedImages?.map((image, index) => (
                <td className="col-auto" key={index}>
                  {(image || initialValue) && !loading && (
                    <Container className="d-flex align-items-center justify-content-center text-center img-container">
                      <img
                        src={image || initialValue}
                        className="img-preview"
                        alt="on stage attendance"
                      />
                    </Container>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <label className="w-100 text-center">
        <input
          style={{ display: 'none' }}
          type="file"
          accept="image/png, image/webp, image/jpg, image/jpeg"
          onChange={(e) => uploadImage(e)}
          multiple
          {...rest}
        />

        <p className={`btn btn-primary image px-5`}>{placeholder}</p>
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
