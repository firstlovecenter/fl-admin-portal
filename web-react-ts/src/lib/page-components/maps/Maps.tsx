import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Button, Container } from 'react-bootstrap'
import HeadingSecondary from 'components/HeadingSecondary'
import { useRouter } from 'next/navigation'
import { BiMap } from 'react-icons/bi'
import { IoIosArrowForward } from 'react-icons/io'
import RoleView from 'auth/RoleView'
import { permitAdmin } from 'permission-utils'

const Maps = () => {
  const router = useRouter()
  const lists = [
    {
      id: 1,
      name: 'indoor outreach venues',
      path: `/maps/indoor-outreach-venues`,
    },
    {
      id: 2,
      name: 'outdoor outreach venues',
      path: `/maps/outdoor-outreach-venues`,
    },
    {
      id: 3,
      name: 'hostel information',
      path: `/maps/hostel-information`,
    },
    {
      id: 4,
      name: 'senior high school information',
      path: `/maps/senior-high-schools`,
    },
  ]

  return (
    <Container>
      <HeadingPrimary>Maps</HeadingPrimary>
      <HeadingSecondary>Click on one of churches below</HeadingSecondary>
      <div className="py-3" />
      <div className="d-grid gap-2">
        <Button
          size="lg"
          className="text-start py-4 mb-4 fs-6"
          variant="outline-primary"
          onClick={() => {
            router.push(`/maps/view-maps`)
          }}
        >
          <BiMap /> View Map
        </Button>
      </div>

      <RoleView roles={permitAdmin('Campus')}>
        {lists.map((list) => (
          <div className="d-grid" key={list.id}>
            <Button
              size="lg"
              className="text-start text-capitalize py-4 d-flex justify-content-between px-5 mb-2 fs-6"
              variant="gray"
              onClick={() => {
                router.push(`${list.path}`)
              }}
            >
              <span>{list.name}</span>
              <div>
                <IoIosArrowForward />
              </div>
            </Button>
          </div>
        ))}
      </RoleView>
    </Container>
  )
}

export default Maps
