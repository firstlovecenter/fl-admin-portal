import { useQuery } from '@apollo/client'
import RoleView from 'auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { StatCard } from 'components/ui/stat-card'
import { ChurchContext } from 'contexts/ChurchContext'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'components/ui/breadcrumb'
import { ChevronRight, Layers, Plus, Search, Users, Waves } from 'lucide-react'
import { permitAdmin } from 'permission-utils'
import { GET_CAMPUS_STREAMS } from 'queries/ListQueries'
import { ChangeEvent, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

type StreamRow = {
  id: string
  name: string
  memberCount: number
  councilCount: number
  vacationStatus?: string | null
  __typename?: 'Stream'
  leader?: {
    id: string
    firstName: string
    lastName: string
    pictureUrl?: string
  } | null
}

type CampusLeader = {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
}

const formatCount = (n: number) => n.toLocaleString('en-GH')

const DisplayAllStreams = () => {
  const { t } = useTranslation()
  const { clickCard, campusId } = useContext(ChurchContext)
  const [search, setSearch] = useState('')

  const { data, loading, error } = useQuery(GET_CAMPUS_STREAMS, {
    variables: { id: campusId },
  })

  const campus = data?.campuses?.[0]
  const streams: StreamRow[] = campus?.streams ?? []

  const term = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!term) return streams
    return streams.filter((s) => {
      const haystack = [
        s.name ?? '',
        s.leader?.firstName ?? '',
        s.leader?.lastName ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [streams, term])

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value)

  return (
    <ApolloWrapper loading={loading} data={data} error={error}>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader bare>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-3 pl-16 pr-16 md:px-4 lg:px-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('directory.list.eyebrow')}
              </p>
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {campus?.name ? `${campus.name} ` : ''}
                <span className="text-members">
                  {t('shared.churchLevelPlural.Stream')}
                </span>
              </h1>
            </div>
            <RoleView roles={permitAdmin('Campus')} directoryLock>
              <Link to="/stream/addstream" className="shrink-0">
                <Button size="sm" className="h-11 gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">
                    {t('directory.list.add', {
                      level: 'Stream',
                    })}
                  </span>
                  <span className="sm:hidden">
                    {t('directory.list.addShort')}
                  </span>
                </Button>
              </Link>
            </RoleView>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-2 lg:px-6">
            <Breadcrumb>
              <BreadcrumbList className="text-xs">
                <BreadcrumbItem>
                  <span>{t('shared.churchLevel.Campus')}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-members">
                    {t('shared.churchLevel.Stream')}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span>{t('shared.churchLevel.Council')}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="border-t border-border lg:hidden">
            <div className="mx-auto max-w-6xl px-4 py-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder={t('directory.list.searchStreams')}
                  value={search}
                  onChange={handleSearch}
                  aria-label={t('directory.list.searchAria', {
                    levelPlural: 'Stream',
                  })}
                />
              </div>
            </div>
          </div>
        </StickyPageHeader>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            <section className="order-2 space-y-3 lg:order-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {term
                    ? t('shared.churchLevelPlural.Stream')
                    : t('directory.list.allOf', {
                        levelPlural: 'Stream',
                      })}
                </h2>
                <span
                  aria-live="polite"
                  className="text-xs tabular-nums text-muted-foreground"
                >
                  {term
                    ? t('directory.list.countOfTotal', {
                        shown: filtered.length,
                        total: streams.length,
                      })
                    : `${streams.length}`}
                </span>
              </div>

              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Waves className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {term
                        ? t('directory.list.noMatchesFor', { term: search })
                        : t('directory.list.noneYet', {
                            levelPlural: 'Stream',
                          })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {term
                        ? t('directory.list.tryDifferentNameOrLeader')
                        : t('directory.list.noneUnder', {
                            parent: 'Campus',
                            levelPlural: 'Stream',
                          })}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {filtered.map((stream) => {
                    const initials =
                      `${stream.leader?.firstName?.[0] ?? ''}${
                        stream.leader?.lastName?.[0] ?? ''
                      }` ||
                      stream.name?.charAt(0) ||
                      '?'

                    return (
                      <Link
                        key={stream.id}
                        to="/stream/displaydetails"
                        onClick={() => clickCard(stream)}
                        aria-label={t('directory.list.openChurch', {
                          name: stream.name,
                        })}
                        className="group rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
                      >
                        <div className="flex min-h-[88px] items-center gap-3 p-4">
                          <Avatar className="size-12 shrink-0">
                            <AvatarImage
                              src={stream.leader?.pictureUrl}
                              alt={
                                stream.leader
                                  ? `${stream.leader.firstName} ${stream.leader.lastName}`
                                  : stream.name
                              }
                            />
                            <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-foreground">
                              {stream.name}{' '}
                              <span className="text-xs font-normal text-muted-foreground">
                                {t('shared.churchLevel.Stream')}
                              </span>
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {stream.leader
                                ? `${stream.leader.firstName} ${stream.leader.lastName}`
                                : t('directory.list.noLeader')}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="gap-1 px-2 py-0.5"
                              >
                                <Users className="size-3" />
                                <span className="font-mono tabular-nums">
                                  {formatCount(stream.memberCount ?? 0)}
                                </span>
                              </Badge>
                              <Badge
                                variant="outline"
                                className="gap-1 px-2 py-0.5"
                              >
                                <Layers className="size-3" />
                                <span className="font-mono tabular-nums">
                                  {formatCount(stream.councilCount ?? 0)}
                                </span>
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <aside className="order-1 space-y-4 lg:sticky lg:top-[104px] lg:order-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('shared.churchLevel.Campus')}
                  </p>
                  <Link
                    to="/campus/displaydetails"
                    onClick={() => campus && clickCard(campus)}
                    className="mt-1 block truncate text-base font-semibold text-foreground hover:underline"
                  >
                    {campus?.name}
                  </Link>
                  {campus?.leader &&
                    (() => {
                      const leader: CampusLeader = campus.leader
                      const displayName =
                        leader.fullName ||
                        [leader.firstName, leader.lastName]
                          .filter(Boolean)
                          .join(' ')
                      const initials =
                        `${leader.firstName?.[0] ?? ''}${
                          leader.lastName?.[0] ?? ''
                        }` ||
                        campus?.name?.charAt(0) ||
                        '?'

                      return (
                        <Link
                          to="/member/displaydetails"
                          onClick={() =>
                            clickCard({ ...leader, __typename: 'Member' })
                          }
                          className="-mx-2 mt-3 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                          <Avatar className="size-10 shrink-0">
                            <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              {t('directory.leaderTitle.leadPastor')}
                            </p>
                            <p className="truncate text-sm font-semibold text-foreground">
                              {displayName || 'Unnamed Pastor'}
                            </p>
                          </div>
                        </Link>
                      )
                    })()}
                  {campus?.admin &&
                    (() => {
                      const admin: CampusLeader = campus.admin
                      const displayName = [admin.firstName, admin.lastName]
                        .filter(Boolean)
                        .join(' ')
                      const initials =
                        `${admin.firstName?.[0] ?? ''}${
                          admin.lastName?.[0] ?? ''
                        }` ||
                        campus?.name?.charAt(0) ||
                        '?'

                      return (
                        <Link
                          to="/member/displaydetails"
                          onClick={() =>
                            clickCard({ ...admin, __typename: 'Member' })
                          }
                          className="-mx-2 mt-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                          <Avatar className="size-10 shrink-0">
                            <AvatarFallback className="bg-members/10 text-sm font-medium text-members">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              {t('directory.displayChurchDetails.admin')}
                            </p>
                            <p className="truncate text-sm font-semibold text-foreground">
                              {displayName ||
                                t('directory.list.unnamed', {
                                  role: t(
                                    'directory.displayChurchDetails.admin'
                                  ),
                                })}
                            </p>
                          </div>
                        </Link>
                      )
                    })()}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label={t('shared.churchLevelPlural.Stream')}
                  value={formatCount(streams.length)}
                  icon={Waves}
                  accent="members"
                  compact
                  loading={loading}
                />
                <Link
                  to="/campus/members"
                  className="block hover:opacity-80 active:opacity-70 transition-opacity rounded-xl"
                >
                  <StatCard
                    label={t('shared.churchesSummary.members')}
                    value={formatCount(campus?.memberCount ?? 0)}
                    icon={Users}
                    accent="members"
                    compact
                    loading={loading}
                  />
                </Link>
              </div>

              <div className="relative hidden lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  className="h-11 pl-9"
                  placeholder={t('directory.list.searchStreams')}
                  value={search}
                  onChange={handleSearch}
                  aria-label={t('directory.list.searchAria', {
                    levelPlural: 'Stream',
                  })}
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllStreams
