import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_OVERSIGHT_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const OversightMembers = () => {
  const { t } = useTranslation()
  const { oversightId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_OVERSIGHT_MEMBERS}
      parentId={oversightId}
      parentTypename="Oversight"
      pluckParent={(data) => data?.oversights?.[0]}
      getHeading={(parent) =>
        parent ? (
          <>
            {parent.name}{' '}
            <span className="text-members">
              {t('directory.detailsStats.members')}
            </span>
          </>
        ) : null
      }
    />
  )
}

export default OversightMembers
