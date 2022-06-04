import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import DisplayChurchDetails from '../../../components/DisplayChurchDetails/DisplayChurchDetails'

import { DISPLAY_CONSTITUENCY } from './ReadQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import BaseComponent from 'components/base-component/BaseComponent'
import { permitAdmin } from 'permission-utils'

const DetailsConstituency = () => {
  const { constituencyId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_CONSTITUENCY, {
    variables: { id: constituencyId },
  })
  const constituency = data?.constituencies[0]

  const details = [
    {
      title: 'Members',
      number: constituency?.memberCount || 0,
      link: `/${constituency?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    { title: 'Target', number: constituency?.target, link: '#', width: 12 },
    {
      title: 'Bacentas',
      number: constituency?.activeBacentaCount || 0,
      link: `/${`Bacenta`.toLowerCase()}/displayall`,
      vacationCount: constituency?.vacationBacentaCount,
    },
    {
      title: 'Fellowships',
      number: constituency?.activeFellowshipCount,
      vacationCount: constituency?.vacationFellowshipCount,
      link: '#',
    },
  ]
  return (
    <BaseComponent loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        details={details}
        loading={loading}
        name={data?.constituencies[0]?.name}
        leaderTitle={'Constituency Overseer'}
        membership={data?.constituencies[0]?.memberCount}
        leader={data?.constituencies[0]?.leader}
        churchId={constituencyId}
        admin={data?.constituencies[0]?.admin}
        churchType={`Constituency`}
        subChurch={`Bacenta`}
        subChurchBasonta="Sonta"
        buttons={data?.constituencies[0]?.bacentas}
        buttonsSecondRow={data?.constituencies[0]?.sontas}
        editlink="/constituency/editconstituency"
        editPermitted={permitAdmin('Council')}
        history={
          data?.constituencies[0]?.history.length !== 0 &&
          data?.constituencies[0]?.history
        }
        breadcrumb={[data?.constituencies[0]?.council, data?.constituencies[0]]}
        vacationCount={constituency?.vacationBacentaCount}
      />
    </BaseComponent>
  )
}

export default DetailsConstituency
