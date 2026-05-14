import { useContext } from 'react'
import { MemberContext } from 'contexts/MemberContext'
import { isViewable } from 'permission-utils'

/**
 * Returns true iff `churchId` is visible to the current user on the spine
 * — i.e. it appears in any of the user's tree reaches OR is a spine
 * ancestor of any tree root. Visibility is strictly read-style: the user
 * can SEE this church (in a breadcrumb, in a list), but holds no
 * authority to ACT on it unless `useCan` also returns true.
 *
 * Returns false while authority is still loading so foreign churches
 * stay hidden until the BE confirms scope.
 */
const useCanViewChurch = (churchId: string | undefined | null): boolean => {
  const { currentUser } = useContext(MemberContext)
  return isViewable(currentUser?.authority?.allowedChurchIds, churchId)
}

export default useCanViewChurch
