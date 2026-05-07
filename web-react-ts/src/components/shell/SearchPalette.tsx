import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ChevronDown, Loader2 } from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { ChurchLevel } from 'global-types'
import { USER_PLACEHOLDER } from 'global-utils'
import { MEMBER_SEARCH } from './SearchPalette.queries'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'components/ui/command'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Button } from 'components/ui/button'
import SearchBadgeIcon from 'components/card/SearchBadgeIcon'

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_LIMIT_COMPACT = 5
const SEARCH_LIMIT_EXPANDED = 50

type LeaderSummary = {
  id?: string
  firstName?: string
  lastName?: string
  nameWithTitle?: string
  pictureUrl?: string
}

type ChurchResult = {
  id: string
  name: string
  noIncomeTracking?: boolean
  currency?: string
  conversionRateToDollar?: number
  leader?: LeaderSummary | null
}

type MemberResult = {
  id: string
  firstName?: string
  lastName?: string
  nameWithTitle?: string
  pictureUrl?: string
  bacenta?: { id: string; name: string } | null
}

type ChurchGroup = {
  key: string
  heading: string
  level: ChurchLevel
  items: ChurchResult[]
}

const initials = (...parts: Array<string | undefined>) =>
  parts
    .filter(Boolean)
    .map((p) => p![0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

type SearchPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SearchPalette = ({ open, onOpenChange }: SearchPaletteProps) => {
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const { setUserFinancials } = useSetUserChurch()

  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')
  const [expanded, setExpanded] = useState(false)

  // Reset on close so re-opening starts clean.
  useEffect(() => {
    if (!open) {
      setInput('')
      setDebounced('')
      setExpanded(false)
    }
  }, [open])

  // Collapse back to compact when the user starts a fresh search.
  useEffect(() => {
    setExpanded(false)
  }, [debounced])

  useEffect(() => {
    const id = setTimeout(() => setDebounced(input.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [input])

  const limit = expanded ? SEARCH_LIMIT_EXPANDED : SEARCH_LIMIT_COMPACT

  const { data, loading } = useQuery(MEMBER_SEARCH, {
    skip: !open || !debounced || !currentUser?.id,
    variables: {
      id: currentUser?.id,
      key: debounced,
      limit,
    },
    fetchPolicy: 'cache-and-network',
  })

  // Gate read on `debounced` so stale results from a prior session don't
  // flash before the new query fires.
  const member = open && debounced ? data?.members?.[0] : null

  const memberResults = useMemo<MemberResult[]>(
    () => (member?.memberSearch ?? []) as MemberResult[],
    [member]
  )

  const churchGroups = useMemo<ChurchGroup[]>(() => {
    if (!member) return []
    return [
      {
        key: 'bacentas',
        heading: 'Bacentas',
        level: 'Bacenta',
        items: (member.bacentaSearch ?? []) as ChurchResult[],
      },
      {
        key: 'governorships',
        heading: 'Governorships',
        level: 'Governorship',
        items: (member.governorshipSearch ?? []) as ChurchResult[],
      },
      {
        key: 'councils',
        heading: 'Councils',
        level: 'Council',
        items: (member.councilSearch ?? []) as ChurchResult[],
      },
      {
        key: 'streams',
        heading: 'Streams',
        level: 'Stream',
        items: (member.streamSearch ?? []) as ChurchResult[],
      },
      {
        key: 'campuses',
        heading: 'Campuses',
        level: 'Campus',
        items: (member.campusSearch ?? []) as ChurchResult[],
      },
      {
        key: 'oversights',
        heading: 'Oversights',
        level: 'Oversight',
        items: (member.oversightSearch ?? []) as ChurchResult[],
      },
    ]
  }, [member])

  const totalResults =
    memberResults.length +
    churchGroups.reduce((sum, g) => sum + g.items.length, 0)
  const showEmpty = !!debounced && !loading && totalResults === 0
  // The palette caps each section at `limit`; if any section is exactly full
  // the user might be missing results below the fold.
  const mayHaveMore =
    !expanded &&
    !loading &&
    totalResults > 0 &&
    (memberResults.length === limit ||
      churchGroups.some((g) => g.items.length === limit))

  const handleSelectMember = (result: MemberResult) => {
    clickCard({ ...result, __typename: 'Member' })
    onOpenChange(false)
    navigate('/member/displaydetails')
  }

  const handleSelectChurch = (church: ChurchResult, level: ChurchLevel) => {
    const card = { ...church, __typename: level }
    clickCard(card)
    if (level === 'Campus') {
      setUserFinancials(card)
    }
    onOpenChange(false)
    navigate(`/${level.toLowerCase()}/displaydetails`)
  }

  return (
    <CommandDialog
      title="Global search"
      description="Search members, bacentas, councils, and more"
      open={open}
      onOpenChange={onOpenChange}
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search members, bacentas, councils…"
        value={input}
        onValueChange={setInput}
      />
      <CommandList className="max-h-[60vh]">
        {!debounced && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Start typing to search across the directory
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Searching…
          </div>
        )}
        {showEmpty && (
          <CommandEmpty>{`No results for "${debounced}"`}</CommandEmpty>
        )}

        {memberResults.length > 0 && (
          <CommandGroup heading="Members">
            {memberResults.map((m) => {
              const fullName =
                m.nameWithTitle ||
                [m.firstName, m.lastName].filter(Boolean).join(' ')
              const subtitle = m.bacenta?.name
                ? `${m.bacenta.name} Bacenta`
                : ''
              return (
                <CommandItem
                  key={`member-${m.id}`}
                  value={`member-${m.id}-${fullName}`}
                  onSelect={() => handleSelectMember(m)}
                  className="gap-3"
                >
                  <Avatar className="size-9 shrink-0">
                    {m.pictureUrl ? (
                      <AvatarImage
                        src={m.pictureUrl || USER_PLACEHOLDER}
                        alt={fullName}
                      />
                    ) : null}
                    <AvatarFallback className="text-[11px]">
                      {initials(m.firstName, m.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {fullName || 'Member'}
                    </p>
                    {subtitle && (
                      <p className="truncate text-xs text-muted-foreground">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {mayHaveMore && (
          <div className="flex justify-center px-2 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs text-muted-foreground"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown className="size-3.5" />
              Show more results
            </Button>
          </div>
        )}

        {churchGroups.map((group) => {
          if (!group.items.length) return null
          return (
            <CommandGroup key={group.key} heading={group.heading}>
              {group.items.map((church) => {
                const leaderName =
                  church.leader?.nameWithTitle ||
                  [church.leader?.firstName, church.leader?.lastName]
                    .filter(Boolean)
                    .join(' ')
                return (
                  <CommandItem
                    key={`${group.key}-${church.id}`}
                    value={`${group.key}-${church.id}-${church.name}`}
                    onSelect={() => handleSelectChurch(church, group.level)}
                    className="gap-3"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <SearchBadgeIcon category={group.level} size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {church.name} {group.level}
                      </p>
                      {leaderName && (
                        <p className="truncate text-xs text-muted-foreground">
                          {leaderName}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}

export default SearchPalette
