import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const checkPermission = useCallback(
    (requiredRoles: string[]) => {
      if (isLoading) return false
      if (!user) {
        router.push('/login')
        return false
      }

      // TODO: Implement role-based access control with custom auth
      // For now, if user is authenticated, they have access
      if (requiredRoles.includes('all')) return true

      return true
    },
    [user, isLoading, router]
  )

  return { checkPermission, user, isLoading }
}
