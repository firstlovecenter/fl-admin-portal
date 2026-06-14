import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ChurchContext } from 'contexts/ChurchContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'

import {
  ARRIVALS_CHURCH_TYPES,
  ArrivalsScopeLevel,
} from '../arrivals-utils'

/**
 * Keeps an arrivals dashboard in step with the "Church in Focus" picker.
 *
 * The one-shot sync in Arrivals.tsx only runs at the `/arrivals` entry route,
 * then `replace`-navigates away and unmounts. Once a dashboard is mounted,
 * changing focus would otherwise leave the page pinned to the previously
 * focused church — so a multi-stream admin could only ever see one stream
 * without navigating fully out and back in (SYN-163).
 *
 * Guards are value-based on purpose: `clickCard` is recreated every render, so
 * relying on its identity in the dependency array would re-fire constantly.
 * Acting only when the focused church actually differs keeps it idempotent.
 */
const useArrivalsScopeSync = (
  level: ArrivalsScopeLevel,
  currentChurchId: string | undefined
): void => {
  const { clickCard } = useContext(ChurchContext)
  const { selectedScope } = useChurchRoleScope()
  const navigate = useNavigate()

  useEffect(() => {
    if (!selectedScope) return
    if (!ARRIVALS_CHURCH_TYPES.has(selectedScope.churchType)) return

    const focusedCard = {
      id: selectedScope.churchId,
      name: selectedScope.churchName,
      __typename: selectedScope.churchType,
    }

    if (selectedScope.churchType === level) {
      // Same level, different church (e.g. multi-stream admin switching
      // streams): update the id in place so the dashboard query and the
      // download button refetch without leaving the route.
      if (selectedScope.churchId !== currentChurchId) {
        clickCard(focusedCard)
      }
      return
    }

    // Focus moved to a different level — sync and route to its dashboard.
    clickCard(focusedCard)
    navigate(`/arrivals/${selectedScope.churchType.toLowerCase()}`, {
      replace: true,
    })
  }, [selectedScope, level, currentChurchId, clickCard, navigate])
}

export default useArrivalsScopeSync
