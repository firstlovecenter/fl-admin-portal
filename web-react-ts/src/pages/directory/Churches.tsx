import MenuButton from 'components/buttons/MenuButton'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { Church, UserRole } from 'global-types'
import PlaceholderCustom from 'components/Placeholder'
import SearchBadgeIcon from 'components/card/SearchBadgeIcon'

const Churches = () => {
  const { currentUser, userJobs } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center">
      <div className="mx-auto w-full max-w-screen-md px-4">
        <div className="text-center">
          <PlaceholderCustom loading={!currentUser.fullName} xs={12} as="h1">
            <h1 className="page-header mb-0">{`${currentUser.fullName}'s`}</h1>
          </PlaceholderCustom>
          <PlaceholderCustom loading={!currentUser.fullName} as="p">
            <p className="text-secondary dark menu-caption">Churches</p>
          </PlaceholderCustom>
        </div>

        <div className="mt-5 grid gap-2 text-left">
          {userJobs.length ? (
            userJobs.map((job: UserRole) =>
              job.church.map((church: Church) => (
                <MenuButton
                  key={church.id}
                  title={church.name}
                  noCaption
                  iconComponent={
                    <SearchBadgeIcon category={church.__typename} size={20} />
                  }
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
      </div>
    </div>
  )
}

export default Churches
