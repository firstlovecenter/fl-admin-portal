import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { useContext } from 'react'
import { Container } from 'react-bootstrap'
import ChurchList from './ChurchList'

const ServicesChurchList = () => {
  const { currentUser, theme } = useContext(MemberContext)

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <PlaceholderCustom xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0  page-header">{`${currentUser.fullName}'s`}</h1>
            <p className={`${theme} menu-subheading`}>Services</p>
          </div>
        </PlaceholderCustom>
        <ChurchList link="/services" color="churches" includeVacation />
      </Container>
    </div>
  )
}

export default ServicesChurchList
