import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { BISH_DASHBOARD_COUNTS } from '../queries/CountQueries'
import { NavBar } from '../components/NavBar'
import { DashboardCard } from '../components/DashboardCard'
import { DashboardButton } from '../components/DashboardButton'
import { ChurchContext } from '../contexts/ChurchContext'

const BishopDashboard = () => {
  const { church, capitalise, bishopID } = useContext(ChurchContext)
  const { data, error, loading } = useQuery(BISH_DASHBOARD_COUNTS, {
    variables: { id: bishopID },
  })

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="container ">
          <h4 className="py-4">Loading...</h4>
          <div className="row row-cols-2 row-cols-lg-4">
            <div className="col">
              <DashboardCard
                name="Members"
                number="Loading..."
                cardLink="/members"
              />
            </div>
            <div className="col">
              <DashboardCard
                name="Pastors"
                number="Loading..."
                cardLink="/pastors"
              />
            </div>
            <div className="col">
              <DashboardCard
                name={
                  church.church === 'town'
                    ? capitalise(church.church) + 's'
                    : capitalise(church.church)
                }
                number="Loading..."
                cardLink={`/${church.church}/displayall`}
              />
            </div>
            <div className="col">
              <DashboardCard
                name="Ministries"
                number="Loading..."
                cardLink={`${church.church}/sonta/displayall`}
              />
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-sm-12 col-md">
              <DashboardButton
                btnText="Register Member"
                btnLink="/member/addmember"
              />
            </div>
            <div className="col-sm-12 col-md">
              <DashboardButton
                btnText="Start a Bacenta"
                btnLink="/bacenta/addbacenta"
              />
            </div>
            <div className="col-sm-12 col-md">
              <DashboardButton
                btnText="Start a Centre"
                btnLink="/centre/addcentre"
              />
            </div>
            <div className="col-sm-12 col-md">
              <DashboardButton
                btnText={`Add ${capitalise(church.church)}`}
                btnLink={`/${church.church}/add${church.church}`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div>
        <NavBar />
        <div className="container">
          <div className="row row-cols-2 row-cols-lg-4">
            <div className="col">
              <DashboardCard name="Members" />
            </div>
            <div className="col">
              <DashboardCard name="Pastors" cardLink="#" />
            </div>

            <div className="col">
              <DashboardCard
                name={
                  church.church === 'town'
                    ? capitalise(church.church) + 's'
                    : capitalise(church.church)
                }
                cardLink={`/${church.church}/displayall`}
              />
            </div>
            <div className="col">
              <DashboardCard
                name="Ministries"
                cardLink={`${church.church}/sonta/displayall`}
              />
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-sm-12 col-md">
              <DashboardButton
                btnText="Register Member"
                btnLink="/member/addmember"
              />
            </div>
            <div className="col-sm-12 col-md">
              <DashboardButton
                btnText="Start a Bacenta"
                btnLink="/bacenta/addbacenta"
              />
            </div>
            <div className="col-sm-12 col-md">
              <DashboardButton
                btnText="Start a Centre"
                btnLink="/centre/addcentre"
              />
            </div>
            <div className="col-sm-12 col-md">
              <DashboardButton
                btnText={`Add ${capitalise(church.church)}`}
                btnLink={`/${church.church}/add${church.church}`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <NavBar />
      <div className="container ">
        <h4 className="py-4">
          {`${data.displayMember.firstName} ${data.displayMember.lastName}`}
          &apos;s Church
        </h4>
        <div className="row row-cols-2 row-cols-lg-4">
          <div className="col">
            <DashboardCard
              name="Members"
              number={data.bishopMemberCount}
              cardLink="/members"
            />
          </div>
          <div className="col">
            <DashboardCard
              name="Pastors"
              number={data.bishopPastorCount}
              cardLink="/pastors"
            />
          </div>
          <div className="col">
            <DashboardCard
              name={
                church.church === 'town'
                  ? capitalise(church.church) + 's'
                  : capitalise(church.church)
              }
              number={data.bishopsCampusTownCount}
              cardLink={`/${church.church}/displayall`}
            />
          </div>
          <div className="col">
            <DashboardCard
              name="Ministries"
              number={data.bishopSontaMemberCount}
              cardLink={`${church.church}/sonta/displayall`}
            />
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-sm-12 col-md">
            <DashboardButton
              btnText="Register Member"
              btnLink="/member/addmember"
            />
          </div>
          <div className="col-sm-12 col-md">
            <DashboardButton
              btnText="Start a Bacenta"
              btnLink="/bacenta/addbacenta"
            />
          </div>
          <div className="col-sm-12 col-md">
            <DashboardButton
              btnText="Start a Centre"
              btnLink="/centre/addcentre"
            />
          </div>
          <div className="col-sm-12 col-md">
            <DashboardButton
              btnText={`Add ${capitalise(church.church)}`}
              btnLink={`/${church.church}/add${church.church}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BishopDashboard
