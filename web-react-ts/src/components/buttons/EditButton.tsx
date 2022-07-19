import React from 'react'
import { PencilSquare } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom'
import './EditButton.css'

const EditButton = ({ link }: { link: string }) => {
  return (
    <Link to={link} className="edit-button text-nowrap">
      <PencilSquare />
      Edit
    </Link>
  )
}

export default EditButton
