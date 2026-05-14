import { useContext } from 'react'
import { MemberContext } from 'contexts/MemberContext'
import { ServantTree } from 'global-types'

/**
 * Returns true iff `churchId` is in the actionable scope of the current
 * user — i.e. it appears in any of the user's servant-tree `reach` arrays.
 *
 * `reach` = the servant-edge church PLUS its spine descendants. Spine
 * ANCESTORS of a servant-edge church are deliberately excluded from this
 * check. A Bacenta leader has no role at the parent Governorship; an
 * Oversight leader has no role at the Denomination above. Those ancestors
 * are still readable (the BE `@churchScoped` filter lets them through so
 * the breadcrumb can render their names) but the user must not be able to
 * CLICK INTO them — that would re-open the breadcrumb-spine-walk class of
 * exploit.
 *
 * In short:
 *   - Render name as text:    ancestor of a servant edge → returns false
 *   - Render as clickable:    self or descendant of a servant edge → returns true
 *   - Render nothing:         outside the user's tree entirely → returns false
 *
 * Falls back to `false` while authority is still loading so foreign
 * churches stay non-interactive until the BE confirms scope.
 */
const useCanViewChurch = (churchId: string | undefined | null): boolean => {
  const { currentUser } = useContext(MemberContext)
  const trees = currentUser?.authority?.servantTrees ?? []
  if (!churchId || trees.length === 0) return false
  return trees.some((tree: ServantTree) => tree.reach.includes(churchId))
}

export default useCanViewChurch
