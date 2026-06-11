import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import LoadingScreen from 'components/base-component/LoadingScreen'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { ChevronRight, Layers, Users } from 'lucide-react'
import { GET_STREAM_COUNCILS } from 'queries/ListQueries'
import { useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

const ACCOUNTS_AUTO_REDIRECT_TYPES = new Set([
  'Oversight',
  'Council',
  'Campus',
])

type CouncilOption = {
  id: string
  name: string
  memberCount?: number
  leader?: {
    id: string
    firstName?: string
    lastName?: string
    pictureUrl?: string
  } | null
}

const formatCount = (n: number) => n.toLocaleString('en-GH')

const AccountsLandingPage = () => {
  const { clickCard } = useContext(ChurchContext)
  const { selectedScope } = useChurchRoleScope()
  const { setUserChurch } = useSetUserChurch()
  const navigate = useNavigate()

  const canAutoRedirect =
    !!selectedScope &&
    ACCOUNTS_AUTO_REDIRECT_TYPES.has(selectedScope.churchType)
  const isStreamScope = selectedScope?.churchType === 'Stream'

  useEffect(() => {
    if (!canAutoRedirect || !selectedScope) return
    clickCard({
      id: selectedScope.churchId,
      name: selectedScope.churchName,
      __typename: selectedScope.churchType,
    })
    navigate(
      `/accounts/${selectedScope.churchType.toLowerCase()}/dashboard`,
      { replace: true }
    )
  }, [canAutoRedirect, selectedScope, clickCard, navigate])

  const { data, loading, error } = useQuery(GET_STREAM_COUNCILS, {
    variables: { id: selectedScope?.churchId },
    skip: !isStreamScope || !selectedScope?.churchId,
  })

  if (canAutoRedirect) {
    return <LoadingScreen />
  }

  const stream = data?.streams?.[0]
  const councils: CouncilOption[] = stream?.councils ?? []

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isStreamScope && !stream?.name ? (
            <Skeleton className="mr-2 inline-block h-7 w-40 align-middle" />
          ) : (
            <>{stream?.name ? `${stream.name} Council ` : 'Council '}</>
          )}
          <span className="text-banking">Accounts</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {isStreamScope
            ? 'Choose a council to continue.'
            : 'Switch to a Stream, Council, or Campus scope to view accounts.'}
        </p>
      </StickyPageHeader>
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        {isStreamScope && (
          <ApolloWrapper loading={loading} data={data} error={error}>
            {councils.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                  <Layers className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    No councils yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This stream has no councils.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {councils.map((council) => {
                  const initials =
                    `${council.leader?.firstName?.[0] ?? ''}${
                      council.leader?.lastName?.[0] ?? ''
                    }` ||
                    council.name?.charAt(0) ||
                    '?'

                  const leaderName = council.leader
                    ? `${council.leader.firstName ?? ''} ${
                        council.leader.lastName ?? ''
                      }`.trim()
                    : ''

                  return (
                    <Link
                      key={council.id}
                      to="/accounts/council/dashboard"
                      onClick={() => {
                        const churchPayload = {
                          id: council.id,
                          name: council.name,
                          __typename: 'Council' as const,
                        }
                        clickCard(churchPayload)
                        setUserChurch(churchPayload)
                      }}
                      aria-label={`Open ${council.name} accounts`}
                      className="group block rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 active:bg-muted"
                    >
                      <div className="flex min-h-[88px] items-center gap-3 p-4">
                        <Avatar className="size-12 shrink-0">
                          <AvatarImage
                            src={council.leader?.pictureUrl}
                            alt={leaderName || council.name}
                          />
                          <AvatarFallback className="bg-banking/10 text-sm font-medium text-banking">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-foreground">
                            {council.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {leaderName || 'No leader'}
                          </p>
                          {typeof council.memberCount === 'number' && (
                            <div className="mt-1.5">
                              <Badge
                                variant="outline"
                                className="gap-1 px-2 py-0.5"
                              >
                                <Users className="size-3" />
                                <span className="font-mono tabular-nums">
                                  {formatCount(council.memberCount)}
                                </span>
                              </Badge>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </ApolloWrapper>
        )}
      </main>
    </div>
  )
}

export default AccountsLandingPage
