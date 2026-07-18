import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { parsePhoneNum, throwToSentry } from 'global-utils'
import { displayError } from 'utils/errorHandler'

import { UPDATE_MEMBER_MUTATION } from '../update/UpdateMutations'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from '../display/ReadQueries'

import { MemberContext } from 'contexts/MemberContext'
import MemberForm from '../reusable-forms/MemberForm'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { CreateMemberFormOptions } from '../create/CreateMember'
import { FormikHelpers } from 'formik'

const UserProfileEditPage = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const {
    data: memberData,
    error: memberError,
    loading: memberLoading,
  } = useQuery(DISPLAY_MEMBER_BIO, {
    variables: { id: currentUser.id },
  })
  const { data: churchData } = useQuery(DISPLAY_MEMBER_CHURCH, {
    variables: { id: currentUser.id },
  })
  const member = memberData?.members[0]
  const memberChurch = churchData?.members[0]

  const initialValues: CreateMemberFormOptions = {
    firstName: member?.firstName ? member?.firstName : '',
    middleName: member?.middleName ? member?.middleName : '',
    lastName: member?.lastName ? member?.lastName : '',
    gender: member?.gender ? member?.gender.gender : '',
    phoneNumber: member?.phoneNumber ? `+${member?.phoneNumber}` : '',
    whatsappNumber: member?.whatsappNumber ? `+${member?.whatsappNumber}` : '',
    email: member?.email ? member?.email : '',
    dob: member?.dob ? member?.dob.date : '',
    maritalStatus: member?.maritalStatus ? member?.maritalStatus.status : '',
    occupation: member?.occupation ? member?.occupation.occupation : '',
    pictureUrl: member?.pictureUrl ? member?.pictureUrl : '',
    bacenta: memberChurch?.bacenta ?? '',
    visitationArea: member?.visitationArea ?? '',
    basonta: memberChurch?.basonta ? memberChurch?.basonta.id : '',
  }

  const [UpdateMember] = useMutation(UPDATE_MEMBER_MUTATION)

  const onSubmit = async (
    values: CreateMemberFormOptions,
    onSubmitProps: FormikHelpers<CreateMemberFormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    //Variables that are not controlled by formik

    try {
      const updateResult = await UpdateMember({
        variables: {
          id: currentUser.id,
          firstName: values.firstName,
          middleName: values.middleName,
          lastName: values.lastName,
          gender: values.gender,
          phoneNumber: parsePhoneNum(values.phoneNumber),
          whatsappNumber: parsePhoneNum(values.whatsappNumber),
          email: values.email?.trim().toLowerCase(),
          dob: values.dob,
          maritalStatus: values.maritalStatus,
          occupation: values.occupation,
          pictureUrl: values.pictureUrl,

          bacenta: values.bacenta.id,
          basonta: values.basonta,
        },
      })

      // errorPolicy: 'all' (SYN-178) puts GraphQL errors in `.errors` rather
      // than rejecting the promise — see SYN-205/SYN-206: without this check a
      // rejected write (e.g. an email already held by another member) still
      // navigated back to the profile as though it had saved.
      if (updateResult.errors?.length) {
        onSubmitProps.setSubmitting(false)
        displayError(
          'There was an error updating your profile',
          new Error(updateResult.errors[0].message)
        )
        return
      }

      onSubmitProps.setSubmitting(false)
      navigate(`/user-profile`)
    } catch (error: unknown) {
      onSubmitProps.setSubmitting(false)
      throwToSentry('There was an error updating your profile\n', error)
    }
  }

  return (
    <ApolloWrapper
      loading={memberLoading}
      error={memberError}
      data={memberData}
    >
      <MemberForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        loading={memberLoading}
        update
      />
    </ApolloWrapper>
  )
}

export default UserProfileEditPage
