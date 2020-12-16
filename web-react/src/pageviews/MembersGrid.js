import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { NavBar } from '../components/NavBar'
import { SideBar } from '../components/SideBar'
import { MemberTable } from '../components/MemberTable'
import { GET_APOSTLE_MEMBERS } from '../queries/ListQueries'
import { ApostleContext } from '../context/ChurchContext'

export const MembersGrid = () => {
  const { apostleID } = useContext(ApostleContext)
  const { data: member, error: memberError, loading: memberLoading } = useQuery(
    GET_APOSTLE_MEMBERS,
    {
      variables: { apostleID: apostleID },
    }
  )

  return (
    <div>
      <NavBar />
      <div className="row w-100 m-0 ">
        <div className="col-lg-3 col-md-4 m-0 px-0">
          <SideBar />
        </div>

        <div className="col px-2">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-2 mb-5 border-bottom">
            <h3 className="h3 ">Search Results</h3>
            <div className="btn-toolbar mb-2 mb-md-0 position-fixedd">
              <div className="btn-group mr-2" />
              <Link
                to="/members/addmember"
                type="button"
                className="btn btn-sm btn-primary"
              >
                Add Member
              </Link>
            </div>
          </div>
          <MemberTable
            member={member}
            memberError={memberError}
            memberLoading={memberLoading}
            list="apostleMemberList"
          />
        </div>
      </div>
    </div>
  )
}
