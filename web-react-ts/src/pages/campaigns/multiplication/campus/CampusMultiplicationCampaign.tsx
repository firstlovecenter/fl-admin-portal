import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { MemberContext } from 'contexts/MemberContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import MenuButton from 'components/buttons/MenuButton'
import {
  BarChartFill,
  FileEarmarkArrowUpFill,
  PencilSquare,
  PieChartFill,
} from 'react-bootstrap-icons'

const CampusMultiplicationCampaign = () => {
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
            color="multiplication"
            onClick={() =>
              navigate(`/campaigns/campus/multiplication/service-form`)
            }
            noCaption
          />
          <MenuButton
            title="Upload Receipts"
            color="multiplication"
            iconComponent={<FileEarmarkArrowUpFill />}
            onClick={() =>
              navigate(`/campaigns/campus/multiplication/banking-slips`)
            }
            noCaption
          />
          <MenuButton
            color="multiplication"
            iconComponent={<BarChartFill />}
            title="View Trends"
            onClick={() => navigate(`/campaigns/campus/multiplication/trends`)}
            noCaption
          />
          <MenuButton
            iconComponent={<PieChartFill />}
            title="Member Conversion Chart"
            color="multiplication"
            noCaption
            onClick={() =>
              navigate(
                `/campaigns/campus/multiplication/member-conversion-chart`
              )
            }
          />
        </div>
      </Container>
    </div>
  )
}

export default CampusMultiplicationCampaign
