import React, { useContext } from 'react'
import { Container, Row, Table, Button } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useQuery } from '@apollo/client'
import { FELLOWSHIP_LATEST_EQUIPMENT_RECORD } from '../../CampaignQueries'
import { useNavigate } from 'react-router'
import HeadingSecondary from 'components/HeadingSecondary'

const FellowshipEquipmentFormDetails = () => {
  const { currentUser } = useContext(MemberContext)
  const { fellowshipId } = useContext(ChurchContext)
  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const { theme } = useContext(MemberContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(
    FELLOWSHIP_LATEST_EQUIPMENT_RECORD,
    {
      variables: {
        fellowshipId: fellowshipId,
      },
    }
  )

  const fellowship = data?.fellowships[0]

  const offeringBags = fellowship?.equipmentRecord?.offeringBags
  const bluetoothSpeakers = fellowship?.equipmentRecord?.bluetoothSpeakers

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <div className="text-center">
          <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
          <HeadingSecondary>Equipment Campaign</HeadingSecondary>
        </div>
        <Row>
          <Table variant={theme} striped bordered>
            <tbody>
              <tr>
                <td>Date </td>
                <td>{new Date().toISOString().slice(0, 10)}</td>
              </tr>
              <tr>
                <td>Offering Bags </td>
                <td>{offeringBags}</td>
              </tr>
              <tr>
                <td>Bluetooth Speakers </td>
                <td>{bluetoothSpeakers}</td>
              </tr>
            </tbody>
          </Table>
        </Row>

        <div className="d-flex justify-content-center pt-5">
          <Button
            size="lg"
            type="submit"
            className={`btn-main ${theme} px-5`}
            onClick={() => navigate(`/campaigns/fellowship/equipment/trends`)}
          >
            Continue
          </Button>
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default FellowshipEquipmentFormDetails
