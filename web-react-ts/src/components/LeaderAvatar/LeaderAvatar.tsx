import CloudinaryImage from 'components/CloudinaryImage'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberWithoutBioData } from 'global-types'
import React, { useContext } from 'react'
import { Col, Row } from 'react-bootstrap'
import Link from 'next/link'

const LeaderAvatar = ({
  leader,
  loading,
  leaderTitle,
}: {
  leader: MemberWithoutBioData
  leaderTitle?: string
  loading?: boolean
}) => {
  const { clickCard } = useContext(ChurchContext)
  const isLoading = loading || !leader

  return (
    <Link
      href="/member/displaydetails"
      onClick={() => {
        clickCard(leader)
      }}
    >
      <Row className="my-2">
        <Col xs="auto">
          <PlaceholderCustom
            className="img-search-placeholder"
            as="div"
            xs={12}
            loading={isLoading}
          >
            <CloudinaryImage
              src={leader?.pictureUrl}
              className="img-search-placeholder"
            />
          </PlaceholderCustom>
        </Col>
        <Col>
          <PlaceholderCustom loading={isLoading} as="span" xs={12}>
            <span className={`card-heading text-secondary text-truncate`}>
              {leaderTitle}
            </span>
          </PlaceholderCustom>
          <PlaceholderCustom loading={isLoading} as="h2" xs={12}>
            <div className="d-flex justify-content-between">
              <h2 className={`card-detail`}>{leader?.nameWithTitle}</h2>
            </div>
          </PlaceholderCustom>
        </Col>
      </Row>
    </Link>
  )
}

export default LeaderAvatar
