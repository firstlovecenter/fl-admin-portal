import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_GOVERNORSHIP_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

export const GovernorshipMembers = () => {
  const { t } = useTranslation()
  const { governorshipId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_GOVERNORSHIP_MEMBERS}
      parentId={governorshipId}
      parentTypename="Governorship"
      pluckParent={(data) => data?.governorships?.[0]}
      getHeading={(parent) =>
        parent ? (
          <>
            {parent.name}{' '}
            <span className="text-members">
              {t('shared.churchLevel.Governorship')}
            </span>
          </>
        ) : null
      }
    />
  )
}

export default GovernorshipMembers
