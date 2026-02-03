import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { Form, Formik, FormikHelpers } from 'formik'
import React, { useContext, useState } from 'react'
import { Button, Col, Container, Row, Spinner } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import * as Yup from 'yup'
import {
  DELETE_MEMBER_TITLES,
  GET_MEMBER_TITLES,
  UPDATE_MEMBER_APPOINTMENT_DATE,
  UPDATE_MEMBER_CONSECRATION_DATE,
  UPDATE_MEMBER_ORDINATION_DATE,
} from './MemberTitleGQL'
import { MemberContext } from 'contexts/MemberContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useMutation, useQuery } from '@apollo/client'
import { throwToSentry } from 'global-utils'

interface MemberTitleRelationship {
  date: string
  node: {
    name: string
    __typename: string
  }
  __typename: string
}

interface TitleConnection {
  edges: MemberTitleRelationship[]
  __typename: string
}

interface Member {
  id: string
  firstName: string
  lastName: string
  titleConnection: TitleConnection
  __typename: string
}

interface Data {
  members: Member[]
}

const parseData = (data: Data) => {
  const result = {
    pastorDate: '',
    reverendDate: '',
    bishopDate: '',
  }

  const member = data.members[0] // Assuming there's only one member in the array

  member.titleConnection.edges.forEach((edge) => {
    const { date, node } = edge
    if (node.name === 'Pastor') {
      result.pastorDate = date
    } else if (node.name === 'Reverend') {
      result.reverendDate = date
    } else if (node.name === 'Bishop') {
      result.bishopDate = date
    }
  })

  return result
}

const MemberTitleForm = () => {
  const { memberId } = useContext(MemberContext)
  const router = useRouter()
  const { data, loading, error } = useQuery(GET_MEMBER_TITLES, {
    variables: {
      id: memberId,
    },
  })
  const [deleting, setDeleting] = useState(false)
  const [UpdateMemberAppointmentDate] = useMutation(
    UPDATE_MEMBER_APPOINTMENT_DATE
  )
  const [UpdateMemberOrdinationDate] = useMutation(
    UPDATE_MEMBER_ORDINATION_DATE
  )
  const [UpdateMemberConsecrationDate] = useMutation(
    UPDATE_MEMBER_CONSECRATION_DATE
  )
  const [DeleteMemberTitles] = useMutation(DELETE_MEMBER_TITLES)
  const member = data?.members[0]

  const titles = data
    ? parseData(data)
    : {
        pastorDate: '',
        reverendDate: '',
        bishopDate: '',
      }

  const initialValues = {
    appointmentDate: titles.pastorDate ?? '',
    ordinationDate: titles.reverendDate ?? '',
    consecrationDate: titles.bishopDate ?? '',
  }

  const validationSchema = Yup.object({
    appointmentDate: Yup.string(),
    ordinationDate: Yup.string(),
    consecrationDate: Yup.string(),
  })

  const onSubmit = async (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)

    const promises = []

    if (values.appointmentDate) {
      promises.push(
        UpdateMemberAppointmentDate({
          variables: {
            id: memberId,
            appointmentDate: values.appointmentDate,
          },
        })
      )
    }

    if (values.ordinationDate) {
      promises.push(
        UpdateMemberOrdinationDate({
          variables: {
            id: memberId,
            ordinationDate: values.ordinationDate,
          },
        })
      )
    }

    if (values.consecrationDate) {
      promises.push(
        UpdateMemberConsecrationDate({
          variables: {
            id: memberId,
            consecrationDate: values.consecrationDate,
          },
        })
      )
    }

    try {
      await Promise.all(promises)
      router.push('/member/displaydetails')
    } catch (err) {
      throwToSentry('Error Updating Member Title', err)
    }

    onSubmitProps.setSubmitting(false)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>Member Title Form</HeadingPrimary>
        <HeadingSecondary>{member?.fullName}</HeadingSecondary>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Form>
              <div className="form-group">
                <Row className="row-cols-1 row-cols-md-2">
                  <div>
                    <Button
                      variant="danger"
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true)
                        try {
                          await DeleteMemberTitles({
                            variables: {
                              id: memberId,
                            },
                          })
                          router.push('/member/displaydetails')
                        } catch (err) {
                          throwToSentry('Error Deleting Member Title', err)
                        } finally {
                          setDeleting(false)
                        }
                      }}
                    >
                      {deleting ? <Spinner /> : 'Delete Title'}
                    </Button>
                  </div>

                  <Col>
                    <Input
                      name="appointmentDate"
                      label="Pastoral Appointment Date"
                      type="date"
                    />
                  </Col>
                  <Col>
                    <Input
                      name="ordinationDate"
                      label="Ordination Date"
                      type="date"
                    />
                  </Col>
                  <Col>
                    <Input
                      name="consecrationDate"
                      label="Consecration Date"
                      type="date"
                    />
                  </Col>
                </Row>
                <div className="mt-5">
                  <SubmitButton formik={formik} />
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Container>
    </ApolloWrapper>
  )
}

export default MemberTitleForm
