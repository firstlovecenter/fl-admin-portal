import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Form, Formik, FormikHelpers } from 'formik'
import Input from 'components/formik/Input'
import { CloudArrowUpFill } from 'react-bootstrap-icons'
import SubmitButton from 'components/formik/SubmitButton'
import Papa from 'papaparse'
import { useMutation } from '@apollo/client'
import { UPLOAD_BACENTA_TARGETS } from './SwollenSundayQueries'
import { throwToSentry } from 'global-utils'
import './SwollenSunday.css'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'
import fileIcon from '../../../assets/excel.png'

type FormOptions = {
  swellDate: string
  data: string
}

const SwollenSundayUploadTargets = () => {
  const { currentUser } = useContext(MemberContext)

  const [data, setData] = useState('')
  const [fileName, setFileName] = useState(false)
  const [file, setFile] = useState(false)

  const [UploadBacentaTargets] = useMutation(UPLOAD_BACENTA_TARGETS)

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const navigate = useNavigate()

  const initialValues: FormOptions = {
    swellDate: new Date().toISOString().slice(0, 10),
    data: '',
  }

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    UploadBacentaTargets({
      variables: {
        swellDate: values?.swellDate,
        data: data,
      },
    })
      .then((res) => {
        onSubmitProps.setSubmitting(false)
        onSubmitProps.resetForm()
        alert('Target File Uploaded successfully')
        navigate(`/campaigns/${churchType.toLowerCase()}/swollen-sunday/target`)
      })
      .catch((error) => {
        onSubmitProps.setSubmitting(false)
        alert(error)
        throwToSentry('', error)
        navigate(`/campaigns/${churchType.toLowerCase()}/swollen-sunday/target`)
      })
  }

  const convertTargetFiletoJson = (e: any) => {
    const files = e.target.files
    setFileName(files[0]?.name)

    if (files) {
      setFile(true)
      Papa.parse(files[0], {
        complete: (results: any) => {
          const jsonData = results?.data?.map((column: any) => {
            return {
              council: column[0],
              governorship: column[1],
              bacenta: column[2],
              code: column[3],
              leader: column[4],
              target: parseInt(column[5]),
            }
          })
          jsonData.shift()

          for (const i in jsonData) {
            if (
              jsonData[i].governorship === '' ||
              jsonData[i].bacenta === '' ||
              jsonData[i].code === '' ||
              jsonData[i].leader === '' ||
              isNaN(jsonData[i].target)
            ) {
              alert(
                'No field must be left empty. Please update all fields and upload the file again'
              )
              navigate(
                `/campaigns/${churchType.toLowerCase()}/swollen-sunday/target`
              )
              break
            }
          }

          const stringifyData = JSON.stringify(jsonData)
          setData(stringifyData)
        },
      })
    }
  }

  const validationSchema = Yup.object({
    swellDate: Yup.date()
      .min(new Date(), "You can't select a Swell Date before today")
      .required('Swell Date is a required field'),
  })

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnMount
    >
      {(formik) => (
        <div>
          <div className="d-flex align-items-center justify-content-center ">
            <div className="text-center">
              <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
              <HeadingSecondary>Swollen Sunday Campaign</HeadingSecondary>
            </div>
          </div>
          <Form className="form-group">
            <Container className="mt-5">
              <small>Swell Date</small>
              <Input
                name="swellDate"
                type="date"
                placeholder="dd/mm/yyyy"
                aria-describedby="swellDate"
              />

              <div className="mt-3">
                <small>Upload Target File .csv</small>
              </div>
              <div>
                {file && (
                  <div className="text-center">
                    <img src={fileIcon} alt="" className="excel-icon " />
                    <small className="text-primary d-block mb-2">
                      {fileName}{' '}
                    </small>
                  </div>
                )}
                <label className="w-100">
                  <input
                    type="file"
                    name="targetFile"
                    id="targetFile"
                    accept=".csv"
                    className="d-none"
                    onChange={(e) => convertTargetFiletoJson(e)}
                  />
                  <p className={`btn btn-danger image`}>
                    Upload File <CloudArrowUpFill size={30} />
                  </p>
                </label>
              </div>
              <div className="d-flex justify-content-center ">
                <SubmitButton formik={formik} />
              </div>
            </Container>
          </Form>
        </div>
      )}
    </Formik>
  )
}

export default SwollenSundayUploadTargets
