import React, { useContext } from 'react'
import { MemberContext } from '@/contexts/MemberContext'
import MemberDisplay from 'pages/directory/reusable-forms/MemberDisplay'

const DetailsMember = () => {
  const { memberId } = useContext(MemberContext)

  return <MemberDisplay memberId={memberId} />
}

export default DetailsMember
