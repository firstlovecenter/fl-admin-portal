import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { MemberContext } from 'contexts/MemberContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { permitAdmin } from 'permission-utils'
import RoleView from 'auth/RoleView'
import MenuButton from 'components/buttons/MenuButton'
import { CiViewList } from 'react-icons/ci'
import { PersonAdd } from 'react-bootstrap-icons'
import { IoPersonAddOutline } from 'react-icons/io5'

const StreamSheepSeekerCampaign = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <div className="text-center">
          <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
          <HeadingSecondary>Sheep Seeking Campaign</HeadingSecondary>
        </div>
        <div className="d-grid gap-2 mt-4 text-center px-4">
          <RoleView roles={permitAdmin('Stream')}>
            <MenuButton
              title="Make Sheep Seeker"
              iconComponent={<PersonAdd />}
              color="sheepseeking"
              noCaption
              onClick={() => navigate('/campaigns/stream/sheepseeker-select')}
            />
          </RoleView>
          <RoleView roles={['sheepseekerStream', 'adminStream', 'adminCampus']}>
            <MenuButton
              title="Register Members"
              iconComponent={<IoPersonAddOutline />}
              color="sheepseeking"
              noCaption
              onClick={() => navigate('/member/addmember')}
            />
          </RoleView>
          <RoleView roles={['sheepseekerStream', 'adminStream', 'adminCampus']}>
            <MenuButton
              title="View Membership"
              iconComponent={<CiViewList />}
              color="sheepseeking"
              noCaption
              onClick={() => navigate('/directory/members')}
            />
          </RoleView>
        </div>
      </Container>
    </div>
  )
}

export default StreamSheepSeekerCampaign
