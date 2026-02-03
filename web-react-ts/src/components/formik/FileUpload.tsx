'use client'

import React, { useContext, useState } from 'react'
import { ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import { Container } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import './Formik.css'
import { FormikComponentProps } from './formik-types'
import { MoonLoader } from 'react-spinners'

interface FileUploadProps extends FormikComponentProps {
  uploadPreset?: string
  tags?: 'facial-recognition'
  initialValue?: string
  setFieldValue: (field: string, value: any) => void
}

const FileUpload = (props: FileUploadProps) => {
  const {
    label,
    name,
    initialValue,
    setFieldValue,
    uploadPreset,
    placeholder,
    tags,
    ...rest
  } = props
  const { currentUser } = useContext(MemberContext)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState('')

  // genereate a random 12 character string
  const randomString = (length: number) => {
    const chars =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * 62)]
    return result
  }

  const uploadFile = async (e: any) => {
    const { files } = e.target
    const date = new Date().toISOString().slice(0, 10)
    const username = `${currentUser.firstName.toLowerCase()}-${currentUser.lastName.toLowerCase()}`
    let filename = `${username}-${currentUser.id}/${date}_${
      files[0]?.name ?? randomString(12)
    }`
    filename = filename.replace(/\s/g, '-')
    filename = filename.replace(/~/g, '-')
    filename = filename.replace(/[^a-zA-Z0-9-_]/g, '')

    const data = new FormData()
    data.append('file', files[0])
    data.append('upload_preset', uploadPreset || '')
    data.append('public_id', filename)

    data.append('tags', tags || '')

    setLoading(true)

    const res = await fetch(
      'https://api.cloudinary.com/v1_1/firstlovecenter/file/upload',
      {
        method: 'POST',
        body: data,
      }
    )
    const file = await res.json()

    setFile(file.secure_url)

    setFieldValue(`${name}`, file.secure_url)
    setLoading(false)
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
      {(file || initialValue) && !loading && (
        <Container className="text-center img-container ">
          <img src={file || initialValue} className="img-preview" alt="" />
        </Container>
      )}
      {!file && !initialValue && !loading && (
        <Container className="text-center img-container border my-3" />
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

        <p className="btn btn-primary px-5 file">{placeholder}</p>
      </label>
      {props.error && <TextError>{props.error}</TextError>}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </>
  )
}

export default FileUpload
