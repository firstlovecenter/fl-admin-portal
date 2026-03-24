import MenuButton from 'components/buttons/MenuButton'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { useContext } from 'react'
import { Pencil } from 'lucide-react'
import { useNavigate } from 'react-router'

const HubCouncilFormMenu = () => {
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
          <HeadingSecondary>Rehearsals</HeadingSecondary>
          <MenuButton
            iconComponent={<Pencil />}
            title="Fill Joint Rehearsals Form"
            color="members"
            onClick={() => navigate(`/hubCouncil/record-rehearsal`)}
            caption="Council Joint"
          />

          <hr />
          <HeadingSecondary>Weekend Ministry Meeting</HeadingSecondary>
          <MenuButton
            iconComponent={<Pencil />}
            title="Fill Sunday Meeting Form"
            caption="Maturity Classes"
            color="green"
            onClick={() => navigate(`/hubCouncil/record-sundayservice`)}
          />
        </div>
      </div>
    </div>
  )
}

export default HubCouncilFormMenu
