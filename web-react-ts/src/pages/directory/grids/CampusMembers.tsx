import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_CAMPUS_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const CampusMembers = () => {
  const { t } = useTranslation()
  const { campusId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_CAMPUS_MEMBERS}
      parentId={campusId}
      parentTypename="Campus"
      pluckParent={(data) => data?.campuses?.[0]}
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

export default CampusMembers
