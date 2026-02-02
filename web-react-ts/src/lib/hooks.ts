import { useRouter, usePathname } from 'next/navigation'
import { useAuth0 } from '@auth0/auth0-react'
import { useCallback } from 'react'

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = useCallback(
    (path: string) => {
      router.push(path)
    },
    [router]
  )

  return { navigate, pathname }
}

export function useRouteProtection() {
  const { user, isLoading } = useAuth0()
  const router = useRouter()

  const checkPermission = useCallback(
    (requiredRoles: string[]) => {
      if (isLoading) return false
      if (!user) {
        router.push('/login')
        return false
      }

      const userRoles = user[`https://flcadmin.netlify.app/roles`] || []
      if (requiredRoles.includes('all')) return true

      return requiredRoles.some((role) => userRoles.includes(role))
    },
    [user, isLoading, router]
  )

  return { checkPermission, user, isLoading }
}
