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

interface FileUploadProps extends FormikComponentProps {
  initialValue?: string
  setFieldValue: (field: string, value: any) => void
}

const FileUpload = (props: FileUploadProps) => {
  const { label, name, initialValue, setFieldValue, placeholder, ...rest } =
    props
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState('')
  const [uploadError, setUploadError] = useState('')

  const [generatePresignedUrl] = useMutation(GENERATE_PRESIGNED_URL)

  const uploadFile = async (e: any) => {
    const files = e.target.files
    const selectedFile = files[0]

    if (!selectedFile) {
      setUploadError('Please select a file to upload')
      return
    }

    setLoading(true)
    setUploadError('')

    try {
      const fileUrl = await uploadToS3({
        file: selectedFile,
        generatePresignedUrl,
      })
      setFile(fileUrl)
      setFieldValue(`${name}`, fileUrl)
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadError(error.message || 'Failed to upload file')
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
      {uploadError && (
        <Container className="text-center text-danger my-2">
          <small>{uploadError}</small>
        </Container>
      )}
      {(file || initialValue) && !loading && (
        <Container className="text-center img-container ">
          <img src={file || initialValue} className="img-preview" alt="" />
        </Container>
      )}
      {!file && !initialValue && !loading && (
        <Container className="text-center img-container border my-3"></Container>
      )}
      <label className="w-100 text-center">
        <input
          id={name}
          name={name}
          style={{ display: 'none' }}
          type="file"
          accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .jpg, .jpeg, .png, .gif, .mp3, .mp4, .mov, .avi, .wmv, .flv, .mkv, .zip, .rar, .gz, .tar, .7z"
          onChange={uploadFile}
          {...rest}
        />

        <p className={`btn btn-primary px-5 file`}>{placeholder}</p>
      </label>
      {props.error && <TextError>{props.error}</TextError>}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </>
  )
}

export default FileUpload
