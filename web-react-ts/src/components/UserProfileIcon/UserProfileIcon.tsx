import React, { useContext } from 'react'
import { useAuth } from 'contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import CloudinaryImage from 'components/CloudinaryImage'
import { USER_PLACEHOLDER } from 'global-utils'
import useClickCard from 'hooks/useClickCard'
import { MemberContext } from 'contexts/MemberContext'

function UserProfileIcon() {
  const { setChurch } = useClickCard()
  const { currentUser } = useContext(MemberContext)
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  if (!currentUser.email) {
    return (
      <div className="flex items-center justify-center py-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setChurch(currentUser.church)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setChurch(currentUser.church)
        }
      }}
      className="flex w-full cursor-pointer items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <CloudinaryImage
        className="h-12 w-12 shrink-0 rounded-full object-cover"
        src={currentUser?.picture || USER_PLACEHOLDER}
        alt={currentUser?.firstName || null}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {currentUser.fullName}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {currentUser.email}
        </div>
      </div>
    </div>
  )
}

export default UserProfileIcon
