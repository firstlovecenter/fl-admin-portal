import CloudinaryImage, {
  CloudinaryImageProps,
} from 'components/CloudinaryImage'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberWithoutBioData } from 'global-types'
import { getFirstLetterInEveryWord } from 'global-utils'
import { useContext } from 'react'
import { Col, Row } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const defaultNav = () => {
    clickCard(member)
    router.push('/member/displaydetails')
  }

  return (
    <Row className="g-0" onClick={onClick ?? defaultNav}>
      <Col xs="auto" className="pe-2">
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
      </Col>
      <Col>
        <PlaceholderCustom loading={isLoading} as="h2" xs={12}>
          <div>
            {member?.firstName +
              ' ' +
              getFirstLetterInEveryWord(member?.middleName) +
              ' ' +
              member?.lastName}
          </div>
        </PlaceholderCustom>
      </Col>
    </Row>
  )
}

export default MemberAvatarWithName
