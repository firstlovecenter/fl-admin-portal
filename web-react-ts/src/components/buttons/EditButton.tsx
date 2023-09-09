import React from 'react'
import { PencilSquare } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom'
import { Button } from 'react-bootstrap'

const EditButton = ({ link }: { link: string }) => {
  return (
    <Link to={link}>
      <Button size="sm" variant="success" className="ms-2 small">
        <PencilSquare />
        Edit
      </Button>
    </Link>
  )
}

export default EditButton
