import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import MembersGrid from 'components/members-grids/MembersGrid'
import { GET_STREAM_MEMBERS } from './GridQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const StreamMembers = () => {
  const { t } = useTranslation()
  const { streamId } = useContext(ChurchContext)

  return (
    <MembersGrid
      query={GET_STREAM_MEMBERS}
      parentId={streamId}
      parentTypename="Stream"
      pluckParent={(data) => data?.streams?.[0]}
      getHeading={(parent) =>
        parent ? (
          <>
            {parent.name}{' '}
            <span className="text-members">
              {t('shared.churchLevel.Stream')}
            </span>
          </>
        ) : null
      }
    />
  )
}

export default StreamMembers
