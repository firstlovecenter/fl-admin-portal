import React, { useState } from 'react'
import { Button, Col, Modal, Row } from 'react-bootstrap'
import { PencilSquare, Trash, Plus } from 'react-bootstrap-icons'
import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import SearchMember from 'components/formik/SearchMember'
import SubmitButton from 'components/formik/SubmitButton'
import { alertMsg, throwToSentry } from '../../global-utils'
import { MemberWithoutBioData, ChurchLevel } from 'global-types'
import {
  ADD_COUNCIL_ADMIN,
  ADD_STREAM_ADMIN,
  ADD_CAMPUS_ADMIN,
  ADD_OVERSIGHT_ADMIN,
  ADD_GOVERNORSHIP_ADMIN,
  DELETE_COUNCIL_ADMIN,
  DELETE_STREAM_ADMIN,
  DELETE_CAMPUS_ADMIN,
  DELETE_OVERSIGHT_ADMIN,
  DELETE_GOVERNORSHIP_ADMIN,
} from './MultiAdminMutations'
import useModal from 'hooks/useModal'
import { useNavigate } from 'react-router-dom'

type MultiAdminManagerProps = {
  admins: MemberWithoutBioData[]
  churchId: string
  churchType: ChurchLevel
  churchName: string
  clickCard: (member: MemberWithoutBioData) => void
}

type FormOptions = {
  adminName: string
  adminSelect: string
}

const MultiAdminManager: React.FC<MultiAdminManagerProps> = ({
  admins,
  churchId,
  churchType,
  churchName,
  clickCard,
}) => {
  const navigate = useNavigate()
  const { show, handleShow, handleClose } = useModal()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<MemberWithoutBioData | null>(null)

  // Add Admin Mutations
  const [AddCouncilAdmin] = useMutation(ADD_COUNCIL_ADMIN)
  const [AddStreamAdmin] = useMutation(ADD_STREAM_ADMIN)
  const [AddCampusAdmin] = useMutation(ADD_CAMPUS_ADMIN)
  const [AddOversightAdmin] = useMutation(ADD_OVERSIGHT_ADMIN)
  const [AddGovernorshipAdmin] = useMutation(ADD_GOVERNORSHIP_ADMIN)

  // Delete Admin Mutations
  const [DeleteCouncilAdmin] = useMutation(DELETE_COUNCIL_ADMIN)
  const [DeleteStreamAdmin] = useMutation(DELETE_STREAM_ADMIN)
  const [DeleteCampusAdmin] = useMutation(DELETE_CAMPUS_ADMIN)
  const [DeleteOversightAdmin] = useMutation(DELETE_OVERSIGHT_ADMIN)
  const [DeleteGovernorshipAdmin] = useMutation(DELETE_GOVERNORSHIP_ADMIN)

  const initialValues: FormOptions = {
    adminName: '',
    adminSelect: '',
  }

  const validationSchema = Yup.object({
    adminSelect: Yup.string().required('Please select an Admin from the dropdown'),
  })

  const getMutationByChurchType = () => {
    switch (churchType) {
      case 'Council':
        return { add: AddCouncilAdmin, delete: DeleteCouncilAdmin, idField: 'councilId' }
      case 'Stream':
        return { add: AddStreamAdmin, delete: DeleteStreamAdmin, idField: 'streamId' }
      case 'Campus':
        return { add: AddCampusAdmin, delete: DeleteCampusAdmin, idField: 'campusId' }
      case 'Oversight':
        return { add: AddOversightAdmin, delete: DeleteOversightAdmin, idField: 'oversightId' }
      case 'Governorship':
        return { add: AddGovernorshipAdmin, delete: DeleteGovernorshipAdmin, idField: 'governorshipId' }
      default:
        return null
    }
  }

  const onSubmit = async (values: FormOptions, onSubmitProps: FormikHelpers<FormOptions>) => {
    // Check if admin is already in the list
    if (admins.some((admin) => admin.id === values.adminSelect)) {
      alertMsg(`This person is already an admin for this ${churchType}`)
      return
    }

    try {
      const mutation = getMutationByChurchType()
      if (!mutation) return

      await mutation.add({
        variables: {
          [mutation.idField]: churchId,
          adminId: values.adminSelect,
        },
      })

      alertMsg(`Admin has been added successfully to ${churchName} ${churchType}`)
      handleClose()
      onSubmitProps.resetForm()
    } catch (e: any) {
      if (e.message?.includes('already an admin')) {
        alertMsg(`This person is already an admin for this ${churchType}`)
      } else {
        throwToSentry('Error adding admin', e)
      }
    }
  }

  const handleDeleteClick = (admin: MemberWithoutBioData) => {
    if (admins.length === 1) {
      alertMsg('Cannot remove the last admin. Please add another admin first.')
      return
    }
    setAdminToDelete(admin)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!adminToDelete) return

    try {
      const mutation = getMutationByChurchType()
      if (!mutation) return

      await mutation.delete({
        variables: {
          [mutation.idField]: churchId,
          adminId: adminToDelete.id,
        },
      })

      alertMsg(`${adminToDelete.firstName} ${adminToDelete.lastName} has been removed as admin`)
      setShowDeleteConfirm(false)
      setAdminToDelete(null)
    } catch (e: any) {
      if (e.message?.includes('last admin')) {
        alertMsg('Cannot remove the last admin from this church level')
      } else {
        throwToSentry('Error removing admin', e)
      }
      setShowDeleteConfirm(false)
      setAdminToDelete(null)
    }
  }

  return (
    <>
      <div className="d-flex flex-column mb-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="fw-semibold text-muted">
            {churchType} Admin{admins.length > 1 ? 's' : ''}
          </span>
          <Button size="sm" variant="outline-primary" onClick={handleShow}>
            <Plus size={16} /> Add Admin
          </Button>
        </div>
        
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="d-flex align-items-center justify-content-between mb-2"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                clickCard(admin)
                navigate('/member/displaydetails')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  clickCard(admin)
                  navigate('/member/displaydetails')
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <MemberAvatarWithName member={admin} size={36} />
            </div>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => handleDeleteClick(admin)}
              disabled={admins.length === 1}
            >
              <Trash size={14} />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Admin Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(formik) => (
            <Form>
              <Modal.Header closeButton>
                Add Admin to {churchName} {churchType}
              </Modal.Header>
              <Modal.Body>
                <Row className="form-row">
                  <Col>
                    <SearchMember
                      name="adminSelect"
                      initialValue=""
                      placeholder="Search and select a member"
                      setFieldValue={formik.setFieldValue}
                      aria-describedby="Member Search"
                      error={formik.errors.adminSelect}
                    />
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <SubmitButton formik={formik} />
                <Button variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          Confirm Remove Admin
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove{' '}
          <strong>
            {adminToDelete?.firstName} {adminToDelete?.lastName}
          </strong>{' '}
          as an admin from {churchName} {churchType}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={confirmDelete}>
            Remove Admin
          </Button>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default MultiAdminManager
