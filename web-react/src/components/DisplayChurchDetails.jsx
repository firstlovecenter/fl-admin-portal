import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { DetailsCard } from './card/DetailsCard.jsx'
import { MemberContext } from '../contexts/MemberContext'
import { ChurchContext } from '../contexts/ChurchContext'
import { Timeline } from './timeline/Timeline.jsx'
import { EditButton } from './buttons/EditButton.jsx'
import { MemberDisplayCard } from './card/MemberDisplayCard'
import { ChurchButton } from './buttons/ChurchButton.jsx'
import RoleView from '../auth/RoleView'
import './DisplayChurchDetails.css'

export const DisplayChurchDetails = (props) => {
  const {
    name,
    leaderTitle,
    leaderName,
    leaderId,
    admin,
    churchHeading,
    subChurch,
    churchType,
    churchNo,
    membership,
    buttons,
    basontaLeaders,
    editlink,
    editRoles,
    history,
    breadcrumb,
  } = props

  const { setMemberId } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)

  return (
    <>
      <div className=" py-2 top-heading title-bar mt-4">
        <div className="container ">
          {breadcrumb
            ? breadcrumb.map((bread, i) => {
                if (i === breadcrumb.length - 1) {
                  return (
                    <small
                      key={i}
                      to={
                        bread?.firstName
                          ? `/dashboard`
                          : `/${bread?.__typename.toLowerCase()}/displaydetails`
                      }
                      className="label text-secondary"
                      // onClick={() => {
                      //   clickCard(bread)
                      // }}
                    >
                      {bread?.name
                        ? `${bread?.name} ${bread?.__typename}`
                        : `Bishop ${bread?.firstName} ${bread?.lastName}`}
                    </small>
                  )
                } else {
                  return (
                    <Link
                      key={i}
                      to={
                        bread?.firstName
                          ? `/dashboard`
                          : `/${bread?.__typename.toLowerCase()}/displaydetails`
                      }
                      className=" label text-secondary"
                      onClick={() => {
                        clickCard(bread)
                      }}
                    >
                      {bread?.name
                        ? `${bread?.name} ${bread?.__typename}`
                        : `Bishop ${bread?.firstName} ${bread?.lastName}`}
                      {' >'}{' '}
                    </Link>
                  )
                }
              })
            : null}
          <h3 className="mx-3 mt-3 font-weight-bold">
            {`${name} ${churchType}`}
            <RoleView roles={editRoles}>
              <EditButton link={editlink} />
            </RoleView>
          </h3>
          {admin && (
            <Link
              to="/member/displaydetails"
              onClick={() => {
                clickCard(admin)
              }}
              className="mx-3 mb-2 text-muted font-weight-bold"
            >
              {admin.firstName} {admin.lastName}
            </Link>
          )}
        </div>
      </div>

      <div className="container">
        <div className="row detail-top-margin ml-2 text-secondary">Details</div>
        <div className="row row-cols-3 detail-bottom-margin">
          <Link
            className="col-9 col-md-6 col-lg-4"
            to={`/${churchType.toLowerCase()}/members`}
          >
            <DetailsCard heading="Membership" detail={membership} />
          </Link>
          <Link
            to="/member/displaydetails"
            onClick={() => {
              setMemberId(leaderId)
            }}
            className="col-9 col-md-6 col-lg-4"
          >
            <DetailsCard heading={leaderTitle} detail={leaderName} />
          </Link>
          <div className="col-9 col-md-6 col-lg-4">
            <DetailsCard heading={churchHeading} detail={churchNo} />
          </div>
        </div>
      </div>
      {subChurch && buttons[0] ? (
        <>
          <div className="container">
            <hr className="hr-line" />

            <div className="row justify-content-between">
              <div className="col">
                <p className="text-secondary">{`${subChurch} Locations`}</p>
              </div>
              <div className="col-auto">
                <Link
                  className="card text-secondary px-1"
                  to={`/${subChurch.toLowerCase()}/displayall`}
                >
                  View All
                </Link>
              </div>
            </div>
          </div>

          <div className="container mb-4 card-button-row">
            <table>
              <tbody>
                <tr>
                  {buttons.map((church, index) => {
                    if (index > 4) {
                      return null
                    }
                    return (
                      <td className="col-auto" key={index}>
                        <ChurchButton church={church} />{' '}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {subChurch && basontaLeaders?.length ? (
        <>
          <div className="container">
            <hr className="hr-line" />

            <div className="row justify-content-between">
              <div className="col">
                <p className="text-secondary">{`${subChurch}`}</p>
              </div>
              <div className="col-auto">
                <Link
                  className="card text-secondary px-1"
                  to={`/${subChurch.toLowerCase()}/displayall`}
                >
                  View All
                </Link>
              </div>
            </div>
          </div>
          <div className="container card-button-row">
            <table>
              <tbody>
                <tr>
                  {basontaLeaders &&
                    basontaLeaders.map((leader, index) => {
                      return (
                        <td className="col-auto" key={index}>
                          <MemberDisplayCard member={leader} />
                        </td>
                      )
                    })}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {history && (
        <div className="container px-3">
          <h5>Church History</h5>
          <Timeline record={history} modifier="church" limit={5} />
        </div>
      )}
    </>
  )
}
