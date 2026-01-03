import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import MenuButton from 'components/buttons/MenuButton'
import { useNavigate } from 'react-router'
import { PieChartFill } from 'react-bootstrap-icons'

const FellowshipMultiplicationCampaign = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename
  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <div className="text-center">
          <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
          <HeadingSecondary>Multiplication Campaign</HeadingSecondary>
        </div>
        <div className="d-grid gap-2 mt-4 text-center px-4">
          <MenuButton
            iconComponent={<PieChartFill />}
            title="Member Conversion Chart"
            color="multiplication"
            noCaption
            onClick={() =>
              navigate(
                `/campaigns/fellowship/multiplication/member-conversion-chart`
              )
            }
          />
        </div>
      </Container>
    </div>
  )
}

export default FellowshipMultiplicationCampaign
