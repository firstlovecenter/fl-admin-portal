import CloudinaryImage, {
  CloudinaryImageProps,
} from 'components/CloudinaryImage'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberWithoutBioData } from 'global-types'
import { getFirstLetterInEveryWord } from 'global-utils'
import { useContext } from 'react'
import { useNavigate } from 'react-router'

const MemberAvatarWithName = ({
  member,
  loading,
  onClick,
  ...rest
}: {
  member: MemberWithoutBioData
  loading?: boolean
  onClick?: () => void
} & Omit<CloudinaryImageProps, 'src'>) => {
  const isLoading = loading || !member
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const defaultNav = () => {
    clickCard(member)
    navigate('/member/displaydetails')
  }

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={onClick ?? defaultNav}>
      <div className="flex-none pr-2">
        <PlaceholderCustom
          className="img-search-placeholder"
          as="div"
          xs={12}
          loading={isLoading}
        >
          <CloudinaryImage
            className="list-img-search-placeholder"
            {...rest}
            src={member?.pictureUrl}
          />
        </PlaceholderCustom>
      </div>
      <div className="flex-1">
        <PlaceholderCustom loading={isLoading} as="h2" xs={12}>
          <div>
            {member?.firstName +
              ' ' +
              getFirstLetterInEveryWord(member?.middleName) +
              ' ' +
              member?.lastName}
          </div>
        </PlaceholderCustom>
      </div>
    </div>
  )
}

export default MemberAvatarWithName
