'use client'

import React, { useContext, useState } from 'react'
import { ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import { Container } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import './Formik.css'
import { FormikComponentProps } from './formik-types'
import { MoonLoader } from 'react-spinners'

interface ImageUploadProps extends FormikComponentProps {
  uploadPreset?: string
  tags?: 'facial-recognition'
  initialValue?: string
  setFieldValue: (field: string, value: any) => void
}

const MultiImageUpload = (props: ImageUploadProps) => {
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

  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const uploadImage = async (e: any) => {
    const chosenImages = Array.prototype.slice.call(e.target.files)
    handleUploadImages(chosenImages)
  }

  const handleUploadImages = async (files: any[]) => {
    const uploaded: string[] = [...uploadedImages]
    let iterationCount = 0
    files.forEach(async (file: any) => {
      setLoading(true)

      const date = new Date().toISOString().slice(0, 10)
      const username = `${currentUser.firstName.toLowerCase()}-${currentUser.lastName.toLowerCase()}`
      let filename = `${username}-${currentUser.id}/${date}_${file.name}`
      filename = filename.replace(/\s/g, '-')
      filename = filename.replace(/~/g, '-')
      const data = new FormData()
      data.append('file', file)
      data.append('upload_preset', uploadPreset || '')
      data.append('public_id', filename)

      data.append('tags', tags || '')

      const res = await fetch(
        'https://api.cloudinary.com/v1_1/firstlovecenter/image/upload',
        {
          method: 'POST',
          body: data,
        }
      )
      if (res) {
        iterationCount++
        const image = await res.json()

        uploaded.push(image.secure_url)
        setUploadedImages([...uploaded])
        setFieldValue(`${name}`, uploaded)

        if (iterationCount >= files.length) {
          setLoading(false)
        }
      }
    })
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
      {props.error && <TextError>{props.error}</TextError>}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </>
  )
}

export default MultiImageUpload
