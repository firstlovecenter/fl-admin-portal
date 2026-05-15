import React from 'react'
import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Graphs.css'

type MembershipCardProps = {
  link: string
  title: string
  count: number
}

const MembershipCard = ({ link, title, count }: MembershipCardProps) => {
  return (
    <div className="card rounded-corners membership-card">
      <Link to={link} className="card-body white-links">
        <span className="membership-icon">
          <Users size={30} />
        </span>
        <p className="dashboard-title big mb-0">{title}</p>
        <div className="info-text">{count}</div>
      </Link>
    </div>
  )
}

export default MembershipCard
