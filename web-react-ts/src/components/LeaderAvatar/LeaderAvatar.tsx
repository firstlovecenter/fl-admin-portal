import CloudinaryImage from 'components/CloudinaryImage'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberWithoutBioData } from 'global-types'
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'

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
      to="/member/displaydetails"
      onClick={() => {
        clickCard(leader)
      }}
    >
      <div className="flex items-center my-2 gap-2">
        <div className="flex-none">
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
        </div>
        <div className="flex-1">
          <PlaceholderCustom loading={isLoading} as="span" xs={12}>
            <span className="card-heading text-muted-foreground truncate">
              {leaderTitle}
            </span>
          </PlaceholderCustom>
          <PlaceholderCustom loading={isLoading} as="h2" xs={12}>
            <div className="flex justify-between">
              <h2 className="card-detail">{leader?.nameWithTitle}</h2>
            </div>
          </PlaceholderCustom>
        </div>
      </div>
    </Link>
  )
}

export default LeaderAvatar
