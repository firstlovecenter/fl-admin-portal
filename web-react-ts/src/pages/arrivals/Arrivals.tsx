import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import ChurchList from 'pages/services/ChurchList'

const ARRIVALS_CHURCH_TYPES = new Set([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
])

const Arrivals = () => {
  const { clickCard } = useContext(ChurchContext)
  const { selectedScope } = useChurchRoleScope()
  const navigate = useNavigate()

  const canAutoRedirect =
    !!selectedScope && ARRIVALS_CHURCH_TYPES.has(selectedScope.churchType)

  useEffect(() => {
    if (!canAutoRedirect || !selectedScope) return

    clickCard({
      id: selectedScope.churchId,
      name: selectedScope.churchName,
      __typename: selectedScope.churchType,
    })
    navigate(`/arrivals/${selectedScope.churchType.toLowerCase()}`, {
      replace: true,
    })
  }, [canAutoRedirect, selectedScope, clickCard, navigate])

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      {!canAutoRedirect && (
        <>
          <StickyPageHeader>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              <span className="text-arrivals">Arrivals</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose a church to continue.
            </p>
          </StickyPageHeader>
          <main className="mx-auto max-w-2xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
            <ChurchList color="arrivals" />
          </main>
        </>
      )}
    </div>
  )
}

export default Arrivals
