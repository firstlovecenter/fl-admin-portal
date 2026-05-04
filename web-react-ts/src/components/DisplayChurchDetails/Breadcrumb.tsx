import { MemberContext } from 'contexts/MemberContext'
import { Church, ChurchLevel } from 'global-types'
import { authorisedLink } from 'global-utils'
import { permitMe } from 'permission-utils'
import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { ChurchContext } from 'contexts/ChurchContext'

export interface BreadcrumbType extends Church {
  __typename: ChurchLevel
  name: string
  governorship?: {
    name: string
  }
}

const Breadcrumb = ({ breadcrumb }: { breadcrumb: BreadcrumbType[] }) => {
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  if (!breadcrumb.length) {
    return <></>
  }

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {breadcrumb.map((bread, i) => {
        if (!bread) return <span key={i} />

        return (
          <span key={i} className="flex items-center gap-1">
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
              {`${bread.name} ${bread?.__typename}`}
            </button>
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
