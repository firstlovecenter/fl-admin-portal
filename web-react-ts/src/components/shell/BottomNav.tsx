import { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from 'components/lib/utils'
import { primaryNav } from './navigation-config'
import useAuth from 'auth/useAuth'
import { MemberContext } from 'contexts/MemberContext'
import { hasOnlyRolesFrom } from 'permission-utils'

export const BottomNav = () => {
  const { isAuthorised } = useAuth()
  const { currentUser } = useContext(MemberContext)
  const userRoles = currentUser?.roles
  const visibleItems = primaryNav.filter((item) => {
    if (item.hideForRoles && hasOnlyRolesFrom(userRoles, item.hideForRoles))
      return false
    if (item.roles && !isAuthorised(item.roles)) return false
    if (item.additionalRoles && !isAuthorised(item.additionalRoles))
      return false
    return true
  })
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'text-brand'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <Icon className="size-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
