import MenuButton from 'components/buttons/MenuButton'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { useContext } from 'react'
import { BsSpeakerFill } from 'react-icons/bs'
import { FaHubspot } from 'react-icons/fa'
import { GiNotebook } from 'react-icons/gi'
import { useNavigate } from 'react-router'

const MinistryFormMenu = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <div>
        <PlaceholderCustom xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0  page-header">{`${currentUser.currentChurch?.name} ${currentUser.currentChurch?.__typename}`}</h1>
            <p className={`menu-subheading`}>Meetings</p>
          </div>
        </PlaceholderCustom>

        <div className="d-grid gap-2 mt-5 text-left">
          <HeadingSecondary>On Stage Attendance</HeadingSecondary>
          <MenuButton
            iconComponent={<BsSpeakerFill />}
            title="Fill On Stage Attendance"
            color="red"
            onClick={() => navigate(`/ministry/record-onstage-attendance`)}
            noCaption
          />
          <HeadingSecondary>Rehearsals</HeadingSecondary>
          <MenuButton
            iconComponent={<FaHubspot />}
            title="Fill Joint Rehearsals Form"
            color="members"
            onClick={() => navigate(`/ministry/record-rehearsal`)}
            caption="Stream Joint"
          />

          <hr />
          <HeadingSecondary>Weekend Ministry Meeting</HeadingSecondary>
          <MenuButton
            iconComponent={<GiNotebook />}
            title="Fill Sunday Meeting Form"
            caption="Stream Joint"
            color="green"
            onClick={() => navigate(`/ministry/record-sundayservice`)}
          />
        </div>
      </div>
    </div>
  )
}

export default MinistryFormMenu
