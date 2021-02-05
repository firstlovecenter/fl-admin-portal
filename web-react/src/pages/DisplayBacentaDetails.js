import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { DisplayChurchDetails } from '../components/DisplayChurchDetails'
import { NavBar } from '../components/NavBar'
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens'
import { DISPLAY_BACENTA } from '../queries/DisplayQueries'
import { ChurchContext } from '../contexts/ChurchContext'

export const DisplayBacentaDetails = () => {
  const { bacentaID } = useContext(ChurchContext)

  const {
    data: bacentaData,
    error: bacentaError,
    loading: bacentaLoading,
  } = useQuery(DISPLAY_BACENTA, {
    variables: { bacentaID: bacentaID },
  })

  if (bacentaError) {
    return <ErrorScreen />
  } else if (bacentaLoading) {
    // Spinner Icon for Loading Screens
    return <LoadingScreen />
  }
  return (
    <div>
      <NavBar />
      <DisplayChurchDetails
        name={bacentaData.displayBacenta.name}
        leaderTitle="Bacenta Leader"
        leaderName={
          bacentaData.displayBacenta.leader
            ? `${bacentaData.displayBacenta.leader.firstName} ${bacentaData.displayBacenta.leader.lastName}`
            : '-'
        }
        leaderID={bacentaData.displayBacenta.leader.memberID}
        membership={bacentaData.bacentaMemberCount}
        churchHeading="No of Bacentas"
        churchNo="2"
        churchType="Bacenta"
        buttons={['']}
      />
    </div>
  )
}
