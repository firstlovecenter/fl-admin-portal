import React from 'react'
import { PeopleFill } from 'react-bootstrap-icons'
import Link from 'next/link'
import './Graphs.css'

type MembershipCardProps = {
  link: string
  title: string
  count: number
}

const MembershipCard = ({ link, title, count }: MembershipCardProps) => {
  return (
    <div className="card rounded-corners membership-card">
      <Link href={link} className="card-body white-links">
        <span className="membership-icon">
          <PeopleFill size={30} />
        </span>
        <p className="dashboard-title big mb-0">{title}</p>
        <div className="info-text">{count}</div>
      </Link>
    </div>
  )
}

export default MembershipCard
