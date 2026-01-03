import MenuButton from 'components/buttons/MenuButton'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { GraphDown } from 'react-bootstrap-icons'
import { GiHumanPyramid } from 'react-icons/gi'
import { useNavigate } from 'react-router'

const ShepherdingControlLandingPage = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <div className="text-center">
          <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
          <HeadingSecondary>Shepherding Control</HeadingSecondary>
        </div>
        <div className="d-grid gap-2 mt-4 text-center px-4">
          <MenuButton
            title="Stats for Year Till Date"
            color="shepherdingcontrol"
            iconComponent={<GraphDown />}
            noCaption
            onClick={() =>
              navigate(
                `/campaigns/${churchType.toLowerCase()}/shepherding-control/year-to-date`
              )
            }
          />

          <MenuButton
            title="Swollen Sunday"
            color="swollensunday"
            iconComponent={<GiHumanPyramid />}
            noCaption
            onClick={() =>
              navigate(`/campaigns/${churchType.toLowerCase()}/swollen-sunday`)
            }
          />
        </div>
      </Container>
    </div>
  )
}

export default ShepherdingControlLandingPage
