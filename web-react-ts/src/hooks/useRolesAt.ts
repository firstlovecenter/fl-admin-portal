import { useContext } from 'react'
import { Role } from 'global-types'
import { MemberContext } from 'contexts/MemberContext'
import { rolesAt } from 'permission-utils'

/**
 * Returns the coarse roles the current user holds AT this specific church.
 * Useful for "you are a Leader here" badges or for branching UI on the
 * caller's level without re-running the full `useCan` check for each
 * possible permitX bucket.
 *
 * Cascades down by construction — a `leaderOversight` on Africa West
 * returns `['leaderOversight']` for every Bacenta beneath it.
 */
const useRolesAt = (churchId: string | undefined | null): Role[] => {
  const { currentUser } = useContext(MemberContext)
  return rolesAt(currentUser?.authority?.servantTrees, churchId)
}

export default useRolesAt
