import { MemberContext } from 'contexts/MemberContext'
import { Church, ChurchLevel } from 'global-types'
import { authorisedLink } from 'global-utils'
import { permitMe } from 'permission-utils'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { ChurchContext } from 'contexts/ChurchContext'
import useCanViewChurch from 'hooks/useCanViewChurch'

export interface BreadcrumbType extends Church {
  __typename: ChurchLevel
  name: string
  governorship?: {
    name: string
  }
}

// Renders one crumb. Gated by `useCanViewChurch(bread.id)` so out-of-scope
// ancestors render as plain text (no click target, no hover affordance) —
// closing the breadcrumb-spine-walk class of exploit (David Dag
// Vanderpuije: clicking up from his Bacenta to land in a foreign
// Denomination/Oversight). Pure visibility gate; the BE `@churchScoped`
// filter on each spine type is the actual authority — this is the FE's
// "don't dangle an unreachable link in front of the user" companion.
const BreadcrumbCrumb = ({ bread }: { bread: BreadcrumbType }) => {
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()
  const canView = useCanViewChurch(bread?.id)

  const label = `${bread.name} ${bread?.__typename}`

  if (!canView) {
    return (
      <span className="bg-transparent border-0 p-0 text-xs transition-colors">
        {label}
      </span>
    )
  }

  return (
    <button
      type="button"
      className="hover:text-foreground active:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs"
      onClick={() => {
        clickCard(bread)
        navigate(
          authorisedLink(
            currentUser,
            permitMe(bread?.__typename),
            `/${bread?.__typename.toLowerCase()}/displaydetails`
          )
        )
      }}
    >
      {label}
    </button>
  )
}

const Breadcrumb = ({ breadcrumb }: { breadcrumb: BreadcrumbType[] }) => {
  if (!breadcrumb.length) {
    return <></>
  }

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {breadcrumb.map((bread, i) => {
        if (!bread) return <span key={i} />

        return (
          <span key={i} className="flex items-center gap-1">
            <BreadcrumbCrumb bread={bread} />
            {i !== breadcrumb.length - 1 && (
              <span className="text-border">›</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

export default Breadcrumb
