import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Button, Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { CloudArrowDownFill, Upload, ShareFill } from 'react-bootstrap-icons'
import { CSVLink } from 'react-csv'
import './SwollenSunday.css'
import MenuButton from 'components/buttons/MenuButton'

interface BacentaTarget {
  council: string
  governorship: string
  bacenta: string
  code: number
  leader: string
  target: string
}

type SwollenTargetTemplateProps = {
  swollenTargetTemplate: BacentaTarget[]
}

const SwollenSundayTarget = ({
  swollenTargetTemplate,
}: SwollenTargetTemplateProps) => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const headers = [
    { label: 'Council', key: 'council' },
    { label: 'Governorship', key: 'governorship' },
    { label: 'Bacenta', key: 'bacenta' },
    { label: 'Code', key: 'code' },
    { label: 'Leader', key: 'leader' },
    { label: 'Target', key: 'target' },
  ]

  return (
    <div>
      <div className="d-flex align-items-center justify-content-center ">
        <div className="text-center">
          <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
          <HeadingSecondary>Swollen Sunday Campaign</HeadingSecondary>
        </div>
      </div>
      <Container className="mt-5">
        <div>
          <small>Click to download csv</small>
        </div>
        <div className="mb-5">
          <Button
            variant="primary"
            className={`p-2 w-100 bacenta-target-download-button`}
            size="sm"
          >
            <CSVLink
              filename={`${church?.name} Bacenta Target Template.csv`}
              headers={headers}
              data={swollenTargetTemplate}
            >
              {'    '}
              <span className="text-white">
                Bacenta Target Template{' '}
                <CloudArrowDownFill size={30} className="p-1" />
              </span>
            </CSVLink>
          </Button>
        </div>
        <div className="d-grid gap-2">
          <MenuButton
            title="Upload Bacenta Targets"
            color="swollensunday"
            iconComponent={<Upload />}
            onClick={() =>
              navigate(
                `/campaigns/${churchType.toLowerCase()}/swollen-sunday/upload-targets`
              )
            }
            noCaption
          />
          {churchType === 'Stream' && (
            <MenuButton
              title="Share Target By Council"
              iconComponent={<ShareFill />}
              noCaption
              color="swollensunday"
              onClick={() =>
                navigate(
                  `/campaigns/${churchType.toLowerCase()}/swollen-sunday/share-target-by-council`
                )
              }
            />
          )}
        </div>
      </Container>
    </div>
  )
}

export default SwollenSundayTarget
