import MenuButton from 'components/buttons/MenuButton'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import People2Icon from 'assets/icons/People2'
import { Church, UserRole } from 'global-types'

const Churches = () => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <div className="text-center">
          <PlaceholderCustom loading={!currentUser.fullName} xs={12} as="h1">
            {' '}
            <h1 className="mb-0 page-header">{`${currentUser.fullName}'s`}</h1>
          </PlaceholderCustom>
          <PlaceholderCustom loading={!currentUser.fullName} as="p">
            <p className="text-secondary dark menu-caption">Churches</p>
          </PlaceholderCustom>
        </div>

        <div className="d-grid gap-2 mt-5 text-left">
          {userJobs.length ? (
            userJobs.map((job: UserRole) =>
              job.church.map((church: Church) => (
                <MenuButton
                  key={church.id}
                  title={church.name}
                  noCaption
                  iconComponent={People2Icon}
                  iconBg
                  iconCaption={church.__typename}
                  onClick={() => {
                    clickCard(church)
                    navigate(
                      `/${church.__typename.toLowerCase()}/displaydetails`
                    )
                  }}
                  color="churches"
                />
              ))
            )
          ) : (
            <>
              <MenuButton color="churches" />
              <MenuButton color="churches" />
            </>
          )}
        </div>
      </Container>
    </div>
  )
}

export default Churches
