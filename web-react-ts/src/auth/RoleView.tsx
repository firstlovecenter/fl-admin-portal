import { Role, StreamOptions } from 'global-types'
import React, { useContext } from 'react'
import { MemberContext } from '../contexts/MemberContext'
import useAuth from './useAuth'

type RoleViewProps = {
  roles: Role[]
  children: React.ReactNode
  verifyId?: string
  permittedStream?: StreamOptions[]
  noIncome?: boolean
}

const RoleView = (props: RoleViewProps) => {
  const { roles, children, verifyId, permittedStream, noIncome } = props
  const { currentUser } = useContext(MemberContext)
  const { isAuthorised } = useAuth()

  const verify = (verifyId: string | undefined) => {
    if (!verifyId) return true

    if (currentUser.id === verifyId) {
      return true
    }

    return false
  }

  const permitStream = (permittedStream: StreamOptions[] | undefined) => {
    if (!permittedStream) return true

    if (permittedStream?.includes(currentUser.stream_name)) {
      return true
    }

    return false
  }

  const includeIncome = (noIncome: boolean | undefined) => {
    if (!noIncome) return true

    if (currentUser.noIncome === noIncome) {
      return true
    }

    return false
  }

  if (
    isAuthorised(roles) &&
    verify(verifyId) &&
    permitStream(permittedStream) &&
    includeIncome(noIncome)
  ) {
    return <>{children}</>
  } else {
    return null
  }
}

export default RoleView
