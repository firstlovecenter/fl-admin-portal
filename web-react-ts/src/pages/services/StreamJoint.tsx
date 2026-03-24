import MenuButton from 'components/buttons/MenuButton'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Pencil, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router'

const StreamJoint = () => {
  const { currentUser, theme } = useContext(MemberContext)
  const navigate = useNavigate()

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <div>
        <PlaceholderCustom xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0  page-header">{`${currentUser.currentChurch?.name} ${currentUser.currentChurch?.__typename}`}</h1>
            <p className={`${theme} menu-subheading`}>Meetings</p>
          </div>
        </PlaceholderCustom>

        <div className="d-grid gap-2 mt-5 text-left">
          <MenuButton
            iconComponent={<Pencil />}
            title="Fill Service Form"
            color="members"
            onClick={() => navigate(`/stream/record-service`)}
            noCaption
          />
          <MenuButton
            iconComponent={<XCircle />}
            title="Cancel Service"
            color="members"
            onClick={() => navigate(`/services/stream/no-service`)}
            noCaption
          />
          {/* <MenuButton
            iconComponent={<Pencil />}
            title="Fill Joint Service Form"
            color="members"
            noCaption
            onClick={() => navigate(`/stream/record-service`)}
          /> */}
        </div>
      </div>
    </div>
  )
}

export default StreamJoint
