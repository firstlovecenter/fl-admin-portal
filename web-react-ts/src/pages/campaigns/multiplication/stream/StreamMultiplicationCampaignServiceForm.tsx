import { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import HeadingSecondary from 'components/HeadingSecondary'
import MultiplicationCampaignServiceForm from '../MulltiplicationCampaignServiceForm'
import { RECORD_MULTIPLICATION_EVENT } from '../MultiplicationQueries'
import { useMutation } from '@apollo/client'

const StreamMultiplicationCampaignServiceForm = () => {
  const { currentUser } = useContext(MemberContext)

  const church = currentUser.currentChurch
  const { campusId } = useContext(ChurchContext)
  const [RecordMultiplicationEvent] = useMutation(RECORD_MULTIPLICATION_EVENT)

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <div className="text-center">
          <HeadingSecondary>Multiplication Campaign</HeadingSecondary>
        </div>
        <MultiplicationCampaignServiceForm
          RecordServiceMutation={RecordMultiplicationEvent}
          church={church}
          churchId={campusId}
          churchType="Stream"
        />
      </Container>
    </div>
  )
}

export default StreamMultiplicationCampaignServiceForm
