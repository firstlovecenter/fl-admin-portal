import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_BACENTA_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const BacentaMembers = () => {
  const { t } = useTranslation()
  const { bacentaId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_BACENTA_MEMBERS}
      parentId={bacentaId}
      parentTypename="Bacenta"
      pluckParent={(data) => data?.bacentas?.[0]}
      getHeading={(parent) =>
        parent ? (
          <>
            {parent.name}{' '}
            <span className="text-members">
              {t('shared.churchLevel.Bacenta')}
            </span>
          </>
        ) : null
      }
    />
  )
}

export default BacentaMembers
