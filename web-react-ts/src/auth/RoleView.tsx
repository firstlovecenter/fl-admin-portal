import { Role, StreamOptions } from 'global-types'
import React, { useContext } from 'react'
import { MemberContext } from '../contexts/MemberContext'
import useAuth from './useAuth'

type RoleViewProps = {
  roles: Role[]
  children: React.ReactNode
  verifyId?: string
  verifyNotId?: string
  permittedStream?: StreamOptions[]
  noIncomeTracking?: boolean
  directoryLock?: boolean
}

const RoleView = (props: RoleViewProps) => {
  const {
    roles,
    children,
    verifyId,
    verifyNotId,
    permittedStream,
    noIncomeTracking,
    directoryLock,
  } = props
  const { currentUser } = useContext(MemberContext)
  const { isAuthorised } = useAuth()

  const verify = (verifyId: string | undefined) => {
    if (!verifyId) return true

    if (currentUser.id === verifyId) {
      return true
    }

    return false
  }

  const verifyNot = (verifyNotId: string | undefined) => {
    if (!verifyNotId) return true

    if (currentUser.id !== verifyNotId) {
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

  const includeIncome = (noIncomeTracking: boolean | undefined) => {
    if (!noIncomeTracking) return true

    if (currentUser.noIncomeTracking === noIncomeTracking) {
      return true
    }

    return false
  }

  const lockDirectory = (directoryLock?: boolean) => {
    if (!directoryLock) {
      return true
    }

    if (
      (new Date().getDay() === 1 && new Date().getHours() >= 12) ||
      new Date().getDay() === 2 ||
      ['fishers']?.some((r) => currentUser?.roles.includes(r))
    ) {
      return true
    }
  }

  if (
    isAuthorised(roles) &&
    verify(verifyId) &&
    verifyNot(verifyNotId) &&
    permitStream(permittedStream) &&
    includeIncome(noIncomeTracking) &&
    lockDirectory(directoryLock)
  ) {
    return <>{children}</>
  }
  return null
}

export default RoleView
