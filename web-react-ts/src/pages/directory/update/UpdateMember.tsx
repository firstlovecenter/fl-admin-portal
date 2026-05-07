import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'

import { parsePhoneNum, throwToSentry } from 'global-utils'
import {
  UPDATE_MEMBER_MUTATION,
  UPDATE_MEMBER_BACENTA,
  UPDATE_MEMBER_BASONTA,
} from './UpdateMutations'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from '../display/ReadQueries'

import { MemberContext } from 'contexts/MemberContext'
import MemberForm from '../reusable-forms/MemberForm'
import { CreateMemberFormOptions } from '../create/CreateMember'
import { FormikHelpers } from 'formik'

const UpdateMember = () => {
  const { memberId } = useContext(MemberContext)

  const {
    data: memberData,
    error: memberError,
    loading: memberLoading,
  } = useQuery(DISPLAY_MEMBER_BIO, {
    variables: { id: memberId },
  })
  const error: any = memberError
  const { data: churchData } = useQuery(DISPLAY_MEMBER_CHURCH, {
    variables: { id: memberId },
  })
  const member = memberData?.members[0]
  const memberChurch = churchData?.members[0]

  const initialValues: CreateMemberFormOptions = {
    firstName: member?.firstName ?? '',
    middleName: member?.middleName ?? '',
    lastName: member?.lastName ?? '',
    gender: member?.gender?.gender ?? '',
    phoneNumber: member?.phoneNumber ? `+${member?.phoneNumber}` : '',
    whatsappNumber: member?.whatsappNumber ? `+${member?.whatsappNumber}` : '',
    email: member?.email ?? '',
    dob: member?.dob ? member.dob.date : '',
    maritalStatus: member?.maritalStatus?.status ?? '',
    occupation: member?.occupation?.occupation ?? '',
    pictureUrl: member?.pictureUrl ?? '',
    visitationArea: member?.visitationArea ?? 'no-location',
    bacenta: memberChurch?.bacenta,
    basonta: memberChurch?.basonta?.id ?? '',
  }

  const navigate = useNavigate()

  const [UpdateMember] = useMutation(UPDATE_MEMBER_MUTATION, {
    refetchQueries: [
      { query: DISPLAY_MEMBER_BIO, variables: { id: memberId } },
      { query: DISPLAY_MEMBER_CHURCH, variables: { id: memberId } },
    ],
  })
  const [UpdateMemberBacenta] = useMutation(UPDATE_MEMBER_BACENTA)
  const [UpdateMemberBasonta] = useMutation(UPDATE_MEMBER_BASONTA)

  const onSubmit = async (
    values: CreateMemberFormOptions,
    onSubmitProps: FormikHelpers<CreateMemberFormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      await UpdateMember({
        variables: {
          id: memberId,
          firstName: values.firstName.trim(),
          middleName: values.middleName.trim(),
          lastName: values.lastName.trim(),
          email: values.email?.trim().toLowerCase(),
          gender: values.gender,
          phoneNumber: parsePhoneNum(values.phoneNumber),
          whatsappNumber: parsePhoneNum(values.whatsappNumber),
          dob: values.dob,
          maritalStatus: values.maritalStatus,
          occupation: values.occupation,
          pictureUrl: values.pictureUrl,

          bacenta: values.bacenta?.id,
        },
      })

      if (memberChurch?.bacenta.id !== values.bacenta.id) {
        await UpdateMemberBacenta({
          variables: {
            memberId: memberId,
            bacentaId: values.bacenta?.id,
            ids: [memberId, values.bacenta?.id, memberChurch?.bacenta.id],
            historyRecord: `${member.firstName} ${member.lastName} moved from ${memberChurch?.bacenta.name} Bacenta to ${values.bacenta?.name} Bacenta`,
          },
        })
      }

      if (values.basonta && memberChurch?.basonta?.id !== values.basonta) {
        await UpdateMemberBasonta({
          variables: {
            memberId: memberId,
            basontaId: values.basonta,
          },
        })
      }

      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      navigate('/member/displaydetails')
    } catch (error: any) {
      throwToSentry('There was an error updating the member profile\n', error)
    }
  }

  if (error) {
    throwToSentry(error)
  }

  return (
    <MemberForm
      title="Edit Member Details"
      initialValues={initialValues}
      onSubmit={onSubmit}
      loading={memberLoading}
      update
    />
  )
}

export default UpdateMember
