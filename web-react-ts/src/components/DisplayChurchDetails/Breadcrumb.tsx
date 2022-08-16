import { MemberContext } from 'contexts/MemberContext'
import { Church, ChurchLevel } from 'global-types'
import { authorisedLink } from 'global-utils'
import { permitMe } from 'permission-utils'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { ChurchContext } from '../../contexts/ChurchContext'
import './Breadcrumb.css'

interface BreadcrumbType extends Church {
  __typename: ChurchLevel
  name: string
  constituency?: {
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
    <>
      {breadcrumb.map((bread, i) => {
        if (!bread) {
          return <div key={i}></div>
        }

        let breadname
        if (bread?.__typename === 'Sonta' && bread.constituency) {
          breadname = bread.name.replace(bread.constituency.name, '')
        } else {
          breadname = bread.name
        }

        return (
          <span
            key={i}
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
            className="crumb label text-secondary"
          >
            {`${breadname} ${bread?.__typename}`}
            {i !== breadcrumb.length - 1 && ' > '}
          </span>
        )
      })}
    </>
  )
}

export default Breadcrumb
