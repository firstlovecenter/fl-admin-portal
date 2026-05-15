import React, { useState } from 'react'
import { ErrorMessage } from 'formik'
import { useMutation } from '@apollo/client'
import { MoonLoader } from 'react-spinners'
import { uploadToS3 } from 'utils/s3Upload'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import TextError from './TextError/TextError'
import './Formik.css'
import { FormikComponentProps } from './formik-types'
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
        <div className="img-container mx-auto my-3 flex items-center justify-center rounded-md border border-border">
          <MoonLoader color="gray" />
        </div>
      )}
      {uploadError && (
        <div className="mx-auto my-2 text-center text-sm text-destructive">
          <small>{uploadError}</small>
        </div>
      )}
      {(file || initialValue) && !loading && (
        <div className="img-container mx-auto flex items-center justify-center text-center">
          <img src={file || initialValue} className="img-preview" alt="" />
        </div>
      )}
      {!file && !initialValue && !loading && (
        <div className="img-container mx-auto my-3 rounded-md border border-border" />
      )}
      <label className="block w-full text-center">
        <input
          id={name}
          name={name}
          className="hidden"
          type="file"
          accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .jpg, .jpeg, .png, .gif, .mp3, .mp4, .mov, .avi, .wmv, .flv, .mkv, .zip, .rar, .gz, .tar, .7z"
          onChange={uploadFile}
          {...rest}
        />

        <Button asChild className={cn('px-8 cursor-pointer')}>
          <span>{placeholder}</span>
        </Button>
      </label>
      {props.error && <TextError>{props.error}</TextError>}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </>
  )
}

export default FileUpload
