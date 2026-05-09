import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApolloError } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Skeleton } from 'components/ui/skeleton'
import { ChevronRight } from 'lucide-react'

export type GridMember = {
  id: string
  firstName?: string
  lastName?: string
  pictureUrl?: string
  bacenta?: { name?: string }
  basonta?: { name?: string }
}

const getInitials = (soul: GridMember) =>
  `${soul.firstName?.[0] ?? ''}${soul.lastName?.[0] ?? ''}`.toUpperCase()

const getSubtitle = (soul: GridMember) =>
  [soul.bacenta?.name, soul.basonta?.name].filter(Boolean).join(' · ')

const MemberRow = ({
  soul,
  onClick,
}: {
  soul: GridMember
  onClick: (soul: GridMember) => void
}) => {
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

const MemberCard = ({
  soul,
  onClick,
}: {
  soul: GridMember
  onClick: (soul: GridMember) => void
}) => {
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

const RowSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
    <Skeleton className="size-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3.5 w-36 rounded" />
      <Skeleton className="h-3 w-24 rounded" />
    </div>
  </div>
)

const CardSkeleton = () => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 min-h-44">
    <Skeleton className="size-16 rounded-full" />
    <div className="flex w-full flex-col items-center gap-1.5">
      <Skeleton className="h-3.5 w-28 rounded" />
      <Skeleton className="h-3 w-20 rounded" />
    </div>
  </div>
)

type MemberTableProps = {
  data: GridMember[]
  error?: ApolloError
  loading: boolean
  fetchingMore?: boolean
}

const MemberTable = ({
  data,
  error,
  loading,
  fetchingMore = false,
}: MemberTableProps) => {
  const { clickCard } = useContext(ChurchContext) as { clickCard: (card: GridMember) => void }
  const navigate = useNavigate()

  if (loading || !data) {
    return (
      <>
        <div className="md:hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-4 py-4">
          {Array.from({ length: 12 }, (_, i) => (
            <CardSkeleton key={i} />
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

  if (!data.length && !fetchingMore) {
    return (
      <p className="px-4 py-20 text-center text-sm text-muted-foreground">
        No members match your search
      </p>
    )
  }

  const handleClick = (soul: GridMember) => {
    clickCard(soul)
    navigate('/member/displaydetails')
  }

  return (
    <>
      <div className="md:hidden">
        {data.map((soul) => (
          <MemberRow key={soul.id} soul={soul} onClick={handleClick} />
        ))}
        {fetchingMore &&
          Array.from({ length: 4 }, (_, i) => <RowSkeleton key={`sk-${i}`} />)}
      </div>
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-4 py-4">
        {data.map((soul) => (
          <MemberCard key={soul.id} soul={soul} onClick={handleClick} />
        ))}
        {fetchingMore &&
          Array.from({ length: 4 }, (_, i) => <CardSkeleton key={`sk-${i}`} />)}
      </div>
    </>
  )
}

export default MemberTable
