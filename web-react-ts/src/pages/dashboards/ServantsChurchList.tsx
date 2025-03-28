import { useContext } from 'react'
import { useNavigate } from 'react-router'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import {
  getMonthlyStatAverage,
  getServiceGraphData,
} from 'pages/services/graphs/graphs-utils'
import MenuButton from 'components/buttons/MenuButton'
import { Container } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { SERVANT_CHURCH_LIST } from './DashboardQueries'
import { useQuery } from '@apollo/client'
import { ChurchLevel, MemberWithChurches } from 'global-types'
import People2Icon from 'assets/icons/People2'

const ServantsChurchList = () => {
  const { memberId } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { data, loading, error } = useQuery(SERVANT_CHURCH_LIST, {
    variables: { id: memberId },
  })
  const servant = data?.members[0]

  const getServantChurches = (servant: MemberWithChurches) => {
    if (!servant) return

    let churches: {
      id: string
      __typename: ChurchLevel
      name: string
      leader: string
      leaderPic: string
      attendance: string | undefined
      income: string | undefined
      link: string
    }[] = []

    const pushIntoChurch = (servantChurches: any[]) => {
      servantChurches.map((church) => {
        const serviceData = getServiceGraphData(church, 'services')

        return churches.push({
          id: church.id,
          __typename: church.__typename,
          name: church.name,
          leader: servant?.fullName,
          leaderPic: servant?.pictureUrl,
          attendance: getMonthlyStatAverage(serviceData, 'attendance'),
          income: getMonthlyStatAverage(serviceData, 'income'),
          link: `/${church.__typename.toLowerCase()}/displaydetails`,
        })
      })
    }

    if (servant?.leadsFellowship?.length) {
      pushIntoChurch(servant?.leadsFellowship)
    }
    if (servant.leadsBacenta) {
      pushIntoChurch(servant?.leadsBacenta)
    }
    if (servant.leadsGovernorship?.length) {
      pushIntoChurch(servant?.leadsGovernorship)
    }

    if (servant?.leadsCouncil?.length) {
      pushIntoChurch(servant?.leadsCouncil)
    }
    if (servant?.leadsStream?.length) {
      pushIntoChurch(servant?.leadsStream)
    }
    if (servant?.leadsCampus?.length) {
      pushIntoChurch(servant?.leadsCampus)
    }
    if (servant?.leadsOversight?.length) {
      pushIntoChurch(servant?.leadsOversight)
    }

    //Administrative
    if (servant?.isArrivalsAdminForGovernorship?.length) {
      pushIntoChurch(servant?.isArrivalsAdminForGovernorship)
    }
    if (servant?.isArrivalsAdminForCouncil?.length) {
      pushIntoChurch(servant?.isArrivalsAdminForCouncil)
    }
    if (servant?.isArrivalsAdminForStream?.length) {
      pushIntoChurch(servant?.isArrivalsAdminForStream)
    }
    if (servant?.isArrivalsAdminForCampus?.length) {
      pushIntoChurch(servant?.isArrivalsAdminForCampus)
    }
    if (servant?.isArrivalsAdminForOversight?.length) {
      pushIntoChurch(servant?.isArrivalsAdminForOversight)
    }
    if (servant?.isSheepSeekerForStream?.length) {
      pushIntoChurch(servant?.isSheepSeekerForStream)
    }

    if (servant?.isAdminForCouncil?.length) {
      pushIntoChurch(servant?.isAdminForCouncil)
    }
    if (servant?.isAdminForGovernorship?.length) {
      pushIntoChurch(servant?.isAdminForGovernorship)
    }
    if (servant?.isAdminForStream?.length) {
      pushIntoChurch(servant?.isAdminForStream)
    }
    if (servant?.isAdminForCampus?.length) {
      pushIntoChurch(servant?.isAdminForCampus)
    }
    if (servant?.isAdminForOversight?.length) {
      pushIntoChurch(servant?.isAdminForOversight)
    }

    // Creative Arts
    if (servant?.leadsHub.length) {
      pushIntoChurch(servant?.leadsHub)
    }
    if (servant?.leadsHubCouncil.length) {
      pushIntoChurch(servant?.leadsHubCouncil)
    }
    if (servant?.leadsMinistry.length) {
      pushIntoChurch(servant?.leadsMinistry)
    }
    if (servant?.leadsCreativeArts.length) {
      pushIntoChurch(servant?.leadsCreativeArts)
    }
    if (servant?.isAdminForMinistry?.length) {
      pushIntoChurch(servant?.isAdminForMinistry)
    }
    if (servant?.isAdminForCreativeArts?.length) {
      pushIntoChurch(servant?.isAdminForCreativeArts)
    }

    //run the get graph function after all checking is done to avoid multiple unnecessary runs
    return churches
  }

  const churches = getServantChurches(servant)

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <Container className="mt-4">
        <HeadingPrimary
          loading={!servant}
        >{`${servant?.fullName}'s Churches`}</HeadingPrimary>

        <div className="d-grid gap-2 text-left">
          {churches?.map((church, i) => (
            <MenuButton
              key={i}
              avatar={church.leaderPic}
              iconComponent={<People2Icon />}
              iconBg={true}
              iconCaption={church.__typename}
              title={`${church.name} ${church.__typename}`}
              caption={church.leader}
              color="churches"
              onClick={() => {
                clickCard(church)
                navigate(church.link)
              }}
            />
          ))}
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default ServantsChurchList
