'use client'

import React from 'react'
import Link from 'next/link'
import './ViewAll.css'
import { Button } from 'react-bootstrap'

const ViewAll = ({ href }: { href: string }) => {
  return (
    <Link className="view-all" href={href}>
      <Button variant="outline-success">VIEW ALL</Button>
    </Link>
  )
}

export default ViewAll
