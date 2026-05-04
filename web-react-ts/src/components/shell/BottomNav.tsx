import { NavLink } from 'react-router-dom'
import { cn } from 'components/lib/utils'
import { primaryNav } from './navigation-config'

export const BottomNav = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {primaryNav.map((item) => {
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
