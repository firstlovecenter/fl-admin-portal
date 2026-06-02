import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'
import { Button } from 'components/ui/button'
import { GET_DENOMINATION_OVERSIGHTS } from '../../../queries/ListQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'

const DisplayAllOversights = () => {
  const { clickCard, denominationId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_DENOMINATION_OVERSIGHTS, {
    variables: { id: denominationId },
  })

  const oversights = data?.denominations[0]?.oversights
  const denomination = data?.denominations[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-lg px-4">
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to="/oversight/displaydetails"
              onClick={() => {
                clickCard(denomination)
              }}
            >
              <h4 className="text-base font-semibold text-foreground">{`${denomination?.name} Denomination`}</h4>
            </Link>
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(denomination?.leader)
              }}
            >
              <h6 className="block text-xs text-foreground">
                <span className="text-muted-foreground">
                  Oversight Leader:{' '}
                </span>
                {denomination?.leader
                  ? ` ${denomination.leader.fullName}`
                  : null}
              </h6>
            </Link>
            {denomination?.admin ? (
              <Link
                className="pb-4 text-xs text-foreground"
                to="/member/displaydetails"
                onClick={() => {
                  clickCard(denomination?.admin)
                }}
              >
                <span className="text-muted-foreground">Admin :</span>{' '}
                {`${denomination?.admin?.fullName}`}
              </Link>
            ) : null}
          </div>
          <RoleView roles={permitAdmin('Denomination')} directoryLock>
            <div className="shrink-0">
              <Button asChild variant="destructive">
                <Link to="/oversight/addoversight">Add Oversight</Link>
              </Button>
            </div>
          </RoleView>
        </div>

        <AllChurchesSummary
          church={oversights}
          memberCount={denomination?.memberCount}
          numberOfChurchesBelow={oversights?.length}
          churchType="Oversight"
          route="denomination"
        />
        <ChurchSearch data={oversights} churchType="Oversight" />
      </div>
    </ApolloWrapper>
  )
}

export default DisplayAllOversights
