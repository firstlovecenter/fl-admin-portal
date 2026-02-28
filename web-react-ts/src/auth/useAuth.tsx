import { useAuth as useAuthContext } from 'contexts/AuthContext'
import { MemberContext } from 'contexts/MemberContext'
import { Role } from 'global-types'
import { useContext } from 'react'

const useAuth = () => {
  const { currentUser } = useContext(MemberContext)
  const { isAuthenticated } = useAuthContext()

  const isAuthorised = (permittedRoles: Role[]) => {
    if (isAuthenticated && permittedRoles?.includes('all')) {
      return true
    }

    if (!permittedRoles) {
      return true
    }

    return (
      isAuthenticated &&
      permittedRoles?.some((r) => currentUser?.roles.includes(r))
    )
  }

  return { isAuthorised }
}

export default useAuth
