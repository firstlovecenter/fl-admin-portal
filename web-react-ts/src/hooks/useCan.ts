import { useContext } from 'react'
import { Role } from 'global-types'
import { MemberContext } from 'contexts/MemberContext'
import { canDoAt } from 'permission-utils'

/**
 * Returns true iff the current user holds one of `permittedRoles` AT the
 * specified `churchId`. The check walks the user's servant trees (loaded
 * once at login from `myAuthority`), not the flat coarse `roles` claim —
 * so `adminStream` for Yaounde does NOT authorise an action on Bo, even
 * though both share the same coarse role.
 *
 * Pair with the existing `permitX(level)` helpers:
 *
 *   const canEdit = useCan(permitAdmin('Governorship'), focusedChurch.id)
 *
 * Returns false while authority is still loading (deny-by-default — the
 * BE will reject the mutation anyway, but the UI shouldn't flash an
 * actionable button mid-fetch).
 */
const useCan = (
  permittedRoles: Role[],
  churchId: string | undefined | null
): boolean => {
  const { currentUser } = useContext(MemberContext)
  return canDoAt(currentUser?.authority?.servantTrees, permittedRoles, churchId)
}

export default useCan
