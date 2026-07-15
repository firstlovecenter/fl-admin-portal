import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'

import { parsePhoneNum, throwToSentry } from 'global-utils'
import { displayError } from 'utils/errorHandler'
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

// Shared by the errorPolicy: 'all' result.errors path and the catch-block's
// graphQLErrors path — both carry the collision the same way.
const extractCollision = (
  errors: readonly { extensions?: unknown }[] | undefined
): MemberCollision | undefined =>
  errors
    ?.map(
      (err) => (err.extensions as CollisionExtension | undefined)?.collision
    )
    .find((collision): collision is MemberCollision => Boolean(collision))

const UpdateMember = () => {
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
    refetchQueries: [
      { query: DISPLAY_MEMBER_BIO, variables: { id: memberId } },
      { query: DISPLAY_MEMBER_CHURCH, variables: { id: memberId } },
    ],
  })
  const [UpdateMemberBacenta] = useMutation(UPDATE_MEMBER_BACENTA)
  const [UpdateMemberBasonta] = useMutation(UPDATE_MEMBER_BASONTA)
  const [ReactivateMember, { loading: reactivating }] = useMutation(
    REACTIVATE_MEMBER_TO_BACENTA
  )

  const onReactivate = async () => {
    if (!collision?.targetBacentaId) {
      displayError(
        'Cannot reactivate',
        new Error('Select a bacenta for this member before reactivating.')
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
      displayError('There was an error reactivating the member', error)
    }
  }

  const onSubmit = async (
    values: CreateMemberFormOptions,
    onSubmitProps: FormikHelpers<CreateMemberFormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      const updateResult = await UpdateMember({
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

      // errorPolicy: 'all' (SYN-178) puts GraphQL errors in `.errors` rather
      // than rejecting the promise — see SYN-205: without this check, a
      // collision (or any other GraphQL error) was silently treated as a
      // success.
      if (updateResult.errors?.length) {
        onSubmitProps.setSubmitting(false)

        const collisionInfo = extractCollision(updateResult.errors)
        if (collisionInfo) {
          setCollision({
            ...collisionInfo,
            targetBacentaId: values.bacenta?.id,
          })
          return
        }

        displayError(
          'There was an error updating the member profile',
          new Error(updateResult.errors[0].message)
        )
        return
      }

      if (memberChurch?.bacenta.id !== values.bacenta.id) {
        const bacentaResult = await UpdateMemberBacenta({
          variables: {
            memberId: memberId,
            bacentaId: values.bacenta?.id,
            ids: [memberId, values.bacenta?.id, memberChurch?.bacenta.id],
            historyRecord: `${member.firstName} ${member.lastName} moved from ${memberChurch?.bacenta.name} Bacenta to ${values.bacenta?.name} Bacenta`,
          },
        })

        if (bacentaResult.errors?.length) {
          onSubmitProps.setSubmitting(false)
          displayError(
            "There was an error updating the member's bacenta",
            new Error(bacentaResult.errors[0].message)
          )
          return
        }
      }

      if (values.basonta && memberChurch?.basonta?.id !== values.basonta) {
        const basontaResult = await UpdateMemberBasonta({
          variables: {
            memberId: memberId,
            basontaId: values.basonta,
          },
        })

        if (basontaResult.errors?.length) {
          onSubmitProps.setSubmitting(false)
          displayError(
            "There was an error updating the member's basonta",
            new Error(basontaResult.errors[0].message)
          )
          return
        }
      }

      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      navigate('/member/displaydetails')
    } catch (error: any) {
      onSubmitProps.setSubmitting(false)

      const collisionInfo = extractCollision(error?.graphQLErrors)

      if (collisionInfo) {
        setCollision({ ...collisionInfo, targetBacentaId: values.bacenta?.id })
        return
      }

      throwToSentry('There was an error updating the member profile\n', error)
    }
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
