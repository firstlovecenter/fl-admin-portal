import React, { useContext } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import Timeline from 'components/Timeline/Timeline'
import MemberRoleList, { getRank } from 'components/MemberRoleList'
import { throwToSentry, USER_PLACEHOLDER } from 'global-utils'
import { getMemberDob } from 'jd-date-utils'
import {
  DISPLAY_MEMBER_ADMIN,
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
  DISPLAY_MEMBER_LEADERSHIP,
} from 'pages/directory/display/ReadQueries'
import {
  Button,
  Card,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap'
import PlaceholderCustom from 'components/Placeholder'
import DetailsCard from 'components/card/DetailsCard'
import EditButton from 'components/buttons/EditButton'
import RoleView from 'auth/RoleView'
import ViewAll from 'components/buttons/ViewAll'
import CloudinaryImage from 'components/CloudinaryImage'
import { Member } from 'global-types'
import { permitAdmin, permitLeader, permitSheepSeeker } from 'permission-utils'
import { BarLoader } from 'react-spinners'
import { FaPhone, FaSave, FaStickyNote } from 'react-icons/fa'
import { Whatsapp } from 'react-bootstrap-icons'
import { ChurchContext } from 'contexts/ChurchContext'
import { useRouter } from 'next/navigation'
import { CREATE_MEMBER_ACCOUNT } from '../create/CreateMutations'
import useModal from 'hooks/useModal'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import Textarea from 'components/formik/Textarea'
import { UPDATE_MEMBER_STICKY_NOTE } from '../update/UpdateMutations'

const generateVCard = async (member: Member, roles: string) => {
  let base64Image = ''
  if (member.pictureUrl) {
    const response = await fetch(member.pictureUrl)
    const buffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(buffer)
    let binaryData = ''
    uint8.forEach((byte) => {
      binaryData += String.fromCharCode(byte)
    })
    base64Image = window.btoa(binaryData)
  }

  const vCard = `BEGIN:VCARD\nVERSION:3.0\nN:${member.lastName};${
    member.firstName
  };${member.middleName?.trim() !== '' ? member.middleName + ';' : ''}${
    !!member.currentTitle ? member.currentTitle + ';' : ''
  }\nFN:${member.nameWithTitle}\nORG:FLC ${
    member?.bacenta?.council.name
  } Council;${
    member.email
      ? '\nEMAIL;type=INTERNET;type=HOME;type=pref:' + member.email
      : ''
  }\nTEL;type=CELL;type=VOICE;type=pref:+${member.phoneNumber}\n${
    member.whatsappNumber !== member.phoneNumber
      ? `;TYPE=HOME:+${member.whatsappNumber}`
      : ''
  }\nNOTE:Visitation Landmark: ${member.visitationArea}\\nOccupation: ${
    member.occupation.occupation || 'None'
  }\\nMarital Status: ${
    member.maritalStatus.status
  }\\n\\nRoles in Church:\\n${roles}\n${
    base64Image ? 'PHOTO;ENCODING=b;TYPE=JPEG:' + base64Image + '\n' : ''
  }BDAY:${member.dob.date}\nADR;TYPE=HOME:;;;;${
    member.visitationArea
  };;\nEND:VCARD`

  return vCard
}

const returnStringMemberRoles = (memberLeader: any, memberAdmin: any) => {
  const rank = getRank(memberLeader, memberAdmin)
  const arrayOfRoles: string[] = []

  Object.entries(rank).map((rank: any) => {
    if (rank[1].length > 0) {
      const place = {
        name: rank[1][0].name,
        __typename: rank[1][0].__typename,
        admin: rank[1][0].admin,
        link: rank[1][0].link,
      }
      const servant = place.admin ? 'Admin' : 'Leader'
      arrayOfRoles.push(`${place.__typename} ${servant}: ${place.name}`)
    }

    return rank
  })

  return arrayOfRoles.join('\\n')
}

const MemberDisplay = ({ memberId }: { memberId: string }) => {
  const {
    data: bioData,
    loading: bioLoading,
    error,
  } = useQuery(DISPLAY_MEMBER_BIO, {
    variables: { id: memberId },
  })
  const { data: churchData, loading: churchLoading } = useQuery(
    DISPLAY_MEMBER_CHURCH,
    {
      variables: { id: memberId },
    }
  )
  const { data: leaderData, loading: leaderLoading } = useQuery(
    DISPLAY_MEMBER_LEADERSHIP,
    {
      variables: { id: memberId },
    }
  )
  const { data: adminData, loading: adminLoading } = useQuery(
    DISPLAY_MEMBER_ADMIN,
    {
      variables: { id: memberId },
    }
  )
  const loading = bioLoading || churchLoading || leaderLoading || adminLoading
  const [CreateMemberAccount, { loading: createLoading }] = useMutation(
    CREATE_MEMBER_ACCOUNT
  )
  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()
  const errorToThrow: any = error
  throwToSentry(errorToThrow)

  const member: Member = bioData?.members[0]
  const memberChurch = churchData?.members[0]
  const memberLeader = leaderData?.members[0]
  const memberAdmin = adminData?.members[0]
  const memberBirthday = getMemberDob(member)
  const roles = returnStringMemberRoles(memberLeader, memberAdmin)

  const [UpdateMemberStickyNote, { loading: noteLoading }] = useMutation(
    UPDATE_MEMBER_STICKY_NOTE
  )
  const { show, handleShow, handleClose } = useModal()
  const initialValues = { note: member?.stickyNote ?? '' }
  const validationSchema = Yup.object({
    note: Yup.string().required('Note is required'),
  })

  const onSubmit = async (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await UpdateMemberStickyNote({
        variables: {
          id: memberId,
          stickyNote: values.note,
          ids: [memberId],
          historyRecord: `Added Sticky Note: ${values.note}`,
        },
      })
    } catch (e) {
    } finally {
      onSubmitProps.setSubmitting(false)
      handleClose()
    }
  }

  const onDelete = async () => {
    try {
      await UpdateMemberStickyNote({
        variables: {
          id: memberId,
          stickyNote: '',
          ids: [memberId],
          historyRecord: `Deleted Sticky Note`,
        },
      })
    } catch (e) {
    } finally {
      handleClose()
    }
  }

  return (
    <Container>
      <Row className="justify-content-between">
        <Col className="col-auto">
          <RoleView
            roles={[
              ...permitSheepSeeker(),
              ...permitAdmin('Governorship'),
              ...permitAdmin('Ministry'),
              ...permitLeader('Bacenta'),
            ]}
          >
            <EditButton link="/member/editmember" />
          </RoleView>
        </Col>

        <RoleView roles={['all']} verifyNotId={member?.id}>
          <Col className="col-auto">
            <Button size="sm" variant="warning" onClick={handleShow}>
              Add Sticky Note
            </Button>
          </Col>
        </RoleView>

        <Modal show={show} onHide={handleClose} centered>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {(formik) => (
              <Form>
                <Modal.Header closeButton>
                  Add or Update Sticky Note
                </Modal.Header>
                <Modal.Body>
                  <p className="text-info">
                    This note will be visible to all Admins and Leaders
                  </p>
                  <small className="text-muted pb-5">
                    You can put Room Number, Special Instructions etc
                  </small>
                  <Textarea name="note" label="Note" />
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="primary" onClick={onDelete}>
                    {!formik.isSubmitting && noteLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      'Delete Note'
                    )}
                  </Button>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting ? <Spinner size="sm" /> : 'Save Note'}
                  </Button>
                </Modal.Footer>
              </Form>
            )}
          </Formik>
        </Modal>
      </Row>
      <div className="d-flex justify-content-center pb-4">
        <PlaceholderCustom
          as="div"
          className="profile-img profile-img-height mx-auto"
          loading={!member || loading}
          xs={12}
        >
          <CloudinaryImage
            className="profile-img bg-secondary"
            src={member?.pictureUrl || USER_PLACEHOLDER}
            alt={`${member?.fullName}`}
            size="large"
          />
        </PlaceholderCustom>
      </div>

      <div className="text-center">
        <PlaceholderCustom as="h3" loading={!member || loading}>
          <h3>
            {member?.nameWithTitle}{' '}
            <Button
              size="sm"
              onClick={async () => {
                const vCard = await generateVCard(
                  { ...member, ...memberChurch },
                  roles
                )
                const blob = new Blob([vCard], { type: 'text/vcard' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${member.nameWithTitle}.vcf`
                a.click()
              }}
            >
              <FaSave size={20} />
            </Button>
          </h3>
        </PlaceholderCustom>

        {(adminLoading || leaderLoading) && (
          <Container className="d-flex flex-column justify-content-center align-items-center">
            <BarLoader color="gray" />
          </Container>
        )}
        <PlaceholderCustom as="h5" loading={adminLoading || leaderLoading}>
          <MemberRoleList
            memberLeader={memberLeader}
            memberAdmin={memberAdmin}
          />
        </PlaceholderCustom>
        {!member?.auth_id && !loading && (
          <Button
            className="mb-3"
            disabled={createLoading}
            onClick={async () => {
              try {
                await CreateMemberAccount({
                  variables: { memberId: memberId },
                })
                alert('Account Created Successfully')
              } catch (error: any) {
                throwToSentry(error)
              }
            }}
          >
            {createLoading ? 'Loading' : 'Create Member Account'}
          </Button>
        )}
      </div>
      {member?.stickyNote && member?.stickyNote?.trim() !== '' ? (
        <div className="my-1">
          <Card border="warning">
            <Card.Header>
              <FaStickyNote /> Sticky Note
            </Card.Header>
            <Card.Body>
              <p>{member?.stickyNote}</p>
            </Card.Body>
          </Card>
        </div>
      ) : (
        <></>
      )}
      <Row>
        <Col>
          <DetailsCard heading="First Name" detail={member?.firstName} />
        </Col>
        <Col>
          <DetailsCard heading="Last Name" detail={member?.lastName || ''} />
        </Col>
        {member?.middleName && (
          <Col sm={12}>
            <DetailsCard
              heading="Middle Name"
              detail={member?.middleName || ' '}
            />
          </Col>
        )}
      </Row>
      <Row>
        <Col>
          <DetailsCard heading="Gender" detail={member?.gender?.gender} />
        </Col>
        <Col>
          <DetailsCard
            heading="Marital Status"
            detail={member?.maritalStatus?.status}
          />
        </Col>
      </Row>
      <Row>
        <Col sm={12}>
          <DetailsCard heading="Date of Birth" detail={memberBirthday || ''} />
        </Col>
        <Col>
          <a href={`tel:${member?.phoneNumber}`}>
            <DetailsCard
              heading="Phone Number"
              loading={!member?.phoneNumber}
              detail={'+' + member?.phoneNumber}
              trailing={
                <Button size="sm" className="rounded-btn">
                  <FaPhone />
                </Button>
              }
            />
          </a>
        </Col>

        <Col>
          <a href={`https://wa.me/${member?.whatsappNumber}`}>
            <DetailsCard
              heading="Whatsapp Number"
              loading={!member?.whatsappNumber}
              detail={'+' + member?.whatsappNumber}
              trailing={
                <Button size="sm" variant="success" className="rounded-btn">
                  <Whatsapp />
                </Button>
              }
            />
          </a>
        </Col>
      </Row>
      <Row>
        {member?.occupation?.occupation && (
          <Col sm={12}>
            <DetailsCard
              heading="Occupation"
              detail={member?.occupation?.occupation || ''}
            />
          </Col>
        )}
        {member?.email && (
          <Col sm={12}>
            <DetailsCard heading="Email Address" detail={member?.email} />
          </Col>
        )}
        {member?.visitationArea && (
          <Col sm={12}>
            <DetailsCard
              heading="Location for IDL"
              detail={member?.visitationArea.toString()}
            />
          </Col>
        )}

        <Col sm={12}>
          <div
            onClick={() => {
              clickCard(memberChurch?.bacenta)
              router.push('/bacenta/displaydetails')
            }}
          >
            <DetailsCard
              heading="Bacenta"
              detail={memberChurch?.bacenta?.name}
            />
          </div>
        </Col>
        {memberChurch?.basonta && (
          <Col>
            <DetailsCard
              heading="Basonta"
              detail={memberChurch?.basonta?.name}
            />
          </Col>
        )}

        {member?.titleConnection?.edges[0]?.node.title && (
          <Col sm={12}>
            <DetailsCard heading="Pastoral Rank" detail={member.currentTitle} />
          </Col>
        )}

        <Row className="mt-5">
          <Col>
            <PlaceholderCustom>
              <h3 className="mb-0">CHURCH HISTORY</h3>
            </PlaceholderCustom>
          </Col>
          <Col className="col-auto">
            <ViewAll href={`/member/history`} />
          </Col>
        </Row>
        <Timeline record={memberChurch?.history} limit={3} />
      </Row>
    </Container>
  )
}

export default MemberDisplay
