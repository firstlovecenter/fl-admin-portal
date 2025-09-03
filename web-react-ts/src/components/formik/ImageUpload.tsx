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

const ImageUpload = (props: ImageUploadProps) => {
  const { label, name, initialValue, setFieldValue, placeholder, ...rest } =
    props
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState('')
  const [uploadError, setUploadError] = useState('')

  const [generatePresignedUrl] = useMutation(GENERATE_PRESIGNED_URL)

  const uploadImage = async (e: any) => {
    const files = e.target.files
    const file = files[0]

    if (!file) return

    try {
      setLoading(true)
      setUploadError('') // Clear any previous errors

      // Upload using presigned URL
      const imageUrl = await uploadToS3({
        file,
        generatePresignedUrl,
      })

      setImage(imageUrl)
      setFieldValue(`${name}`, imageUrl)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Upload failed:', error)

      // Set user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload image'
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
      {(image || initialValue) && !loading && (
        <Container className="text-center img-container ">
          <img src={image || initialValue} className="img-preview" alt="" />
        </Container>
      )}
      {!image && !initialValue && !loading && (
        <Container className="text-center img-container border my-3"></Container>
      )}
      <label className="w-100 text-center">
        <input
          id={name}
          name={name}
          style={{ display: 'none' }}
          type="file"
          accept="image/png, image/webp, image/jpg, image/jpeg"
          onChange={uploadImage}
          {...rest}
        />

        <p className={`btn btn-primary px-5 image`}>{placeholder}</p>
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

export default ImageUpload
