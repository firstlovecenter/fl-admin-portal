import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { MemberContext } from 'contexts/MemberContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import MenuButton from 'components/buttons/MenuButton'
import {
  PencilSquare,
  FileEarmarkArrowUpFill,
  BarChartFill,
  PieChartFill,
} from 'react-bootstrap-icons'

const CouncilMultiplicationCampaign = () => {
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
            title="Fill Multiplication Event"
            iconComponent={<PencilSquare />}
            noCaption
            color="multiplication"
            onClick={() =>
              navigate(`/campaigns/council/multiplication/service-form`)
            }
          />
          <MenuButton
            title="Upload Receipts"
            iconComponent={<FileEarmarkArrowUpFill />}
            noCaption
            color="multiplication"
            onClick={() =>
              navigate(`/campaigns/council/multiplication/banking-slips`)
            }
          />
          <MenuButton
            iconComponent={<BarChartFill />}
            title="View Trends"
            color="multiplication"
            noCaption
            onClick={() => navigate(`/campaigns/council/multiplication/trends`)}
          />
          <MenuButton
            iconComponent={<PieChartFill />}
            title="Member Conversion Chart"
            color="multiplication"
            noCaption
            onClick={() =>
              navigate(
                `/campaigns/council/multiplication/member-conversion-chart`
              )
            }
          />
        </div>
      </Container>
    </div>
  )
}

export default CouncilMultiplicationCampaign
