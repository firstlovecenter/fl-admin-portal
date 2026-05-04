import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChurchContext } from 'contexts/ChurchContext'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Skeleton } from 'components/ui/skeleton'
import { ChevronRight } from 'lucide-react'

const getInitials = (soul) =>
  `${soul.firstName?.[0] ?? ''}${soul.lastName?.[0] ?? ''}`.toUpperCase()

const getSubtitle = (soul) =>
  [soul.bacenta?.name, soul.basonta?.name].filter(Boolean).join(' · ')

const MemberRow = ({ soul, onClick }) => {
  const subtitle = getSubtitle(soul)
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors border-b border-border last:border-0 text-left min-h-16"
      onClick={() => onClick(soul)}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarImage
          src={soul.pictureUrl}
          alt={`${soul.firstName} ${soul.lastName}`}
        />
        <AvatarFallback className="bg-members/15 text-members text-xs font-semibold">
          {getInitials(soul)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {soul.firstName} {soul.lastName}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
    </button>
  )
}

const MemberCard = ({ soul, onClick }) => {
  const subtitle = getSubtitle(soul)
  return (
    <button
      type="button"
      onClick={() => onClick(soul)}
      className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-members/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 min-h-44"
    >
      <Avatar className="size-16">
        <AvatarImage
          src={soul.pictureUrl}
          alt={`${soul.firstName} ${soul.lastName}`}
        />
        <AvatarFallback className="bg-members/15 text-members text-base font-semibold">
          {getInitials(soul)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 w-full">
        <p className="text-sm font-medium text-foreground truncate">
          {soul.firstName} {soul.lastName}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  )
}

const MemberTable = ({ data, error, loading }) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  if (loading || !data) {
    return (
      <>
        {/* Mobile skeleton list */}
        <div className="md:hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-border"
            >
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-36 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
        {/* Desktop skeleton grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-4 py-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 rounded-xl border border-border p-4"
            >
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <p className="px-4 py-10 text-center text-sm text-destructive">
        Could not load members. Please try again.
      </p>
    )
  }

  if (!data.length) {
    return (
      <p className="px-4 py-20 text-center text-sm text-muted-foreground">
        No members match your search
      </p>
    )
  }

  const handleClick = (soul) => {
    clickCard(soul)
    navigate('/member/displaydetails')
  }

  return (
    <>
      {/* Mobile: list */}
      <div className="md:hidden">
        {data.map((soul) => (
          <MemberRow key={soul.id} soul={soul} onClick={handleClick} />
        ))}
      </div>

      {/* Tablet + Desktop: grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-4 py-4">
        {data.map((soul) => (
          <MemberCard key={soul.id} soul={soul} onClick={handleClick} />
        ))}
      </div>
    </>
  )
}

export default MemberTable
