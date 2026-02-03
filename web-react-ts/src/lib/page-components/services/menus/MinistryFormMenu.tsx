import MenuButton from 'components/buttons/MenuButton'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { BsSpeakerFill } from 'react-icons/bs'
import { FaHubspot } from 'react-icons/fa'
import { GiNotebook } from 'react-icons/gi'
import { useRouter } from 'next/navigation'

const MinistryFormMenu = () => {
  const { currentUser } = useContext(MemberContext)
  const router = useRouter()

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <PlaceholderCustom xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0  page-header">{`${currentUser.currentChurch?.name} ${currentUser.currentChurch?.__typename}`}</h1>
            <p className="menu-subheading">Meetings</p>
          </div>
        </PlaceholderCustom>

        <div className="d-grid gap-2 mt-5 text-left">
          <HeadingSecondary>On Stage Attendance</HeadingSecondary>
          <MenuButton
            iconComponent={<BsSpeakerFill />}
            title="Fill On Stage Attendance"
            color="red"
            onClick={() => router.push(`/ministry/record-onstage-attendance`)}
            noCaption
          />
          <HeadingSecondary>Rehearsals</HeadingSecondary>
          <MenuButton
            iconComponent={<FaHubspot />}
            title="Fill Joint Rehearsals Form"
            color="members"
            onClick={() => router.push(`/ministry/record-rehearsal`)}
            caption="Stream Joint"
          />

          <hr />
          <HeadingSecondary>Weekend Ministry Meeting</HeadingSecondary>
          <MenuButton
            iconComponent={<GiNotebook />}
            title="Fill Sunday Meeting Form"
            caption="Stream Joint"
            color="green"
            onClick={() => router.push(`/ministry/record-sundayservice`)}
          />
        </div>
      </Container>
    </div>
  )
}

export default MinistryFormMenu
