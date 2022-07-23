import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import DisplayChurchList from '../../../components/DisplayChurchList'
import { ChurchContext } from '../../../contexts/ChurchContext'
import RoleView from '../../../auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdmin } from 'permission-utils'
import { GET_SONTA_MEMBERS } from '../grids/GridQueries'
import { Sonta, Stream } from 'global-types'

interface StreamWithSontas extends Stream {
  sontas: Sonta[]
}
const DisplaySontasByConstituency = () => {
  const { councilId, setConstituencyId, setSontaId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_SONTA_MEMBERS, {
    variables: { id: councilId },
  })

  const constituencies = data.constituencies

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className=" container">
        <div className="mb-4 border-bottom">
          <div className="row justify-content-between">
            <div className="col-auto">
              <Link
                to={`/constituency/displaydetails`}
                onClick={() => {
                  setConstituencyId(councilId)
                }}
              >
                {' '}
                <h4>{`${constituencies[0].council?.name}'s Sontas`}</h4>
              </Link>
            </div>
            <RoleView roles={permitAdmin('Constituency')}>
              <div className="col-auto">
                <Link
                  to="/bacenta/addbacenta"
                  className="btn btn-primary text-nowrap"
                >
                  Add Bacenta
                </Link>
              </div>
            </RoleView>
          </div>

          <div className="row justify-content-between">
            <Link
              className="py-1 px-2 m-2 card"
              to="/campus/displayall"
            >{`constituencies: ${constituencies.length}`}</Link>

            <div className="py-1 px-2 m-2 card">{`Membership: ${data?.bishopSontaMemberCount}`}</div>
          </div>
        </div>

        {constituencies.map((campus: StreamWithSontas) => {
          return (
            <div key={campus.id}>
              <h4>{campus.name}</h4>
              <DisplayChurchList
                data={campus.sontas}
                setter={setSontaId}
                churchType="Sonta"
              />
            </div>
          )
        })}
      </div>
    </ApolloWrapper>
  )
}

export default DisplaySontasByConstituency
