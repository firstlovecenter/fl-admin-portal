import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import './Directory.css'
import ChurchIcon from '../../assets/church-svgrepo-com.svg'
import MemberIcon from '../../assets/people-svgrepo-com.svg'
import QuickFactsIcon from '../../assets/stars-svgrepo-com.svg'
import { useQuery } from '@apollo/client'
import { SERVANT_CHURCHES_COUNT } from './DashboardQueries'
import MenuButton from 'components/buttons/MenuButton'
import { useNavigate } from 'react-router'
import { getChurchCount, getMemberCount } from 'global-utils'

const Directory = () => {
  const { currentUser, theme } = useContext(MemberContext)
  const { data } = useQuery(SERVANT_CHURCHES_COUNT, {
    variables: { id: currentUser.id },
  })
  const navigate = useNavigate()

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <PlaceholderCustom loading={!currentUser.fullName} xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0 page-header">{`${currentUser.fullName}'s`}</h1>
            <p className={`${theme} menu-subheading`}>Directory</p>
          </div>
        </PlaceholderCustom>

        <div className="d-grid gap-2 mt-5 text-left">
          <MenuButton
            icon={MemberIcon}
            title="members"
            caption={getMemberCount(data?.members[0])}
            color="members"
            onClick={() => navigate(`/directory/members`)}
          />
          <MenuButton
            icon={ChurchIcon}
            title="churches"
            caption={getChurchCount(data?.members[0])}
            color="churches"
            onClick={() => navigate(`/directory/churches`)}
          />
          <MenuButton
            icon={QuickFactsIcon}
            title="quick facts"
            caption={'Quick facts about your church'}
            color="quick-facts"
            onClick={() => navigate(`/directory/quick-facts/church-list`)}
          />
        </div>
      </Container>
    </div>
  )
}

export default Directory
