import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { useTranslation } from 'react-i18next'

import { parsePhoneNum, throwToSentry } from 'global-utils'
import { displayError } from 'utils/errorHandler'
import { CALLER_HANDLES_ERRORS_CONTEXT } from 'lib/createApolloClient'
import {
  UPDATE_MEMBER_MUTATION,
  UPDATE_MEMBER_BACENTA,
  UPDATE_MEMBER_BASONTA,
  REACTIVATE_MEMBER_TO_BACENTA,
} from './UpdateMutations'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from '../display/ReadQueries'

import { MemberContext } from 'contexts/MemberContext'
import MemberForm from '../reusable-forms/MemberForm'
import { CreateMemberFormOptions } from '../create/CreateMember'
import { FormikHelpers } from 'formik'
import MemberCollisionDialog, { MemberCollision } from './MemberCollisionDialog'

type CollisionExtension = { collision?: MemberCollision }

const extractCollision = (
  errors: readonly { extensions?: unknown }[] | undefined
): MemberCollision | undefined =>
  errors
    ?.map(
      (err) => (err.extensions as CollisionExtension | undefined)?.collision
    )
    .find((collision): collision is MemberCollision => Boolean(collision))

const UpdateMember = () => {
  const { t } = useTranslation()
  const { memberId, setMemberId } = useContext(MemberContext)
  const [collision, setCollision] = useState<MemberCollision | null>(null)

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
    // SYN-208 — onSubmit surfaces every error from this mutation itself.
    context: CALLER_HANDLES_ERRORS_CONTEXT,
    refetchQueries: [
      { query: DISPLAY_MEMBER_BIO, variables: { id: memberId } },
      { query: DISPLAY_MEMBER_CHURCH, variables: { id: memberId } },
    ],
  })
  const [UpdateMemberBacenta] = useMutation(UPDATE_MEMBER_BACENTA, {
    context: CALLER_HANDLES_ERRORS_CONTEXT,
  })
  const [UpdateMemberBasonta] = useMutation(UPDATE_MEMBER_BASONTA, {
    context: CALLER_HANDLES_ERRORS_CONTEXT,
  })
  const [ReactivateMember, { loading: reactivating }] = useMutation(
    REACTIVATE_MEMBER_TO_BACENTA,
    { context: CALLER_HANDLES_ERRORS_CONTEXT }
  )

  const onReactivate = async () => {
    if (!collision?.targetBacentaId) {
      displayError(
        t('directory.updateMember.cannotReactivate'),
        new Error(t('directory.updateMember.selectBacentaBeforeReactivating'))
      )
      return
    }

    try {
      const res = await ReactivateMember({
        variables: {
          memberId: collision.memberId,
          bacentaId: collision.targetBacentaId,
        },
      })

      const reactivatedId =
        res.data?.ReactivateMemberToBacenta?.id ?? collision.memberId

      setCollision(null)
      setMemberId(reactivatedId)
      navigate('/member/displaydetails')
    } catch (error: unknown) {
      displayError(t('directory.updateMember.reactivateError'), error)
    }
  }

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
          email: values.email?.trim().toLowerCase() || null,
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
    } catch (error: any) {
      onSubmitProps.setSubmitting(false)
      const collisionInfo = extractCollision(error?.graphQLErrors)
      if (collisionInfo) {
        setCollision({
          ...collisionInfo,
          targetBacentaId: values.bacenta?.id,
          targetBacentaName: values.bacenta?.name,
        })
        return
      }
      displayError(t('directory.updateMember.updateProfileError'), error)
      return
    }

    if (memberChurch?.bacenta.id !== values.bacenta.id) {
      try {
        await UpdateMemberBacenta({
          variables: {
            memberId: memberId,
            bacentaId: values.bacenta?.id,
            ids: [memberId, values.bacenta?.id, memberChurch?.bacenta.id],
            historyRecord: `${member.firstName} ${member.lastName} moved from ${memberChurch?.bacenta.name} Bacenta to ${values.bacenta?.name} Bacenta`,
          },
        })
      } catch (error: any) {
        onSubmitProps.setSubmitting(false)
        displayError(t('directory.updateMember.updateBacentaError'), error)
        return
      }
    }

    if (values.basonta && memberChurch?.basonta?.id !== values.basonta) {
      try {
        await UpdateMemberBasonta({
          variables: {
            memberId: memberId,
            basontaId: values.basonta,
          },
        })
      } catch (error: any) {
        onSubmitProps.setSubmitting(false)
        displayError(t('directory.updateMember.updateBasontaError'), error)
        return
      }
    }

    onSubmitProps.setSubmitting(false)
    onSubmitProps.resetForm()
    navigate('/member/displaydetails')
  }

  if (error) {
    throwToSentry(error)
  }

  return (
    <>
      <MemberForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        loading={memberLoading}
        update
      />
      <MemberCollisionDialog
        collision={collision}
        reactivating={reactivating}
        onReactivate={onReactivate}
        onClose={() => setCollision(null)}
      />
    </>
  )
}

export default UpdateMember
