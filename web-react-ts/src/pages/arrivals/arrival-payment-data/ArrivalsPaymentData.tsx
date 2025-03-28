import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { MemberContext } from 'contexts/MemberContext'
import { getHumanReadableDate } from 'jd-date-utils'
import React, { useContext } from 'react'
import { Container, Button } from 'react-bootstrap'
import { CSVLink } from 'react-csv'
import { DISPLAY_ARRIVALS_PAYMENT_DATA } from '../arrivalsQueries'
import NoDataComponent from '../CompNoData'
import { ChurchContext } from 'contexts/ChurchContext'

interface ArrivalPaymentData {
  stream: string
  bacenta: string
  council: string
  councilHead: string
  governorship: string
  leader: string
  bacentaCode: string
  attendance: number
  confirmedAttendance: number
  vehicle: string
  outbound: boolean
  topUp: number
  vehicleCost: number
  momoNumber: number
  momoName: string
  comments: string
  society: string
  date: string
  arrivalTime: string
}

const ArrivalsPaymentData = () => {
  const today = new Date().toISOString().slice(0, 10).toString()
  const { currentUser } = useContext(MemberContext)
  const { arrivalDate } = useContext(ChurchContext)
  const church = currentUser?.currentChurch
  const headers = [
    { label: 'Date', key: 'date' },
    { label: 'Stream', key: 'stream' },
    { label: 'Council', key: 'council' },
    { label: 'Council Head', key: 'councilHead' },
    { label: 'Governorship', key: 'governorship' },
    { label: 'Bacenta', key: 'bacenta' },
    { label: 'Leader', key: 'leader' },
    { label: 'Bacenta Code', key: 'bacentaCode' },
    { label: 'Attendance', key: 'attendance' },
    { label: 'Confirmed Attendance', key: 'confirmedAttendance' },
    { label: 'Vehicle', key: 'vehicle' },
    { label: 'In and Out', key: 'outbound' },
    { label: 'Top Up', key: 'topUp' },
    { label: 'Vehicle Cost', key: 'vehicleCost' },
    { label: 'Momo Number', key: 'momoNumber' },
    { label: 'Momo Name', key: 'momoName' },
    { label: 'Comments', key: 'comments' },
    { label: 'Society', key: 'society' },
    { label: 'Arrival Time', key: 'arrivalTime' },
  ]

  const { data, loading, error } = useQuery(DISPLAY_ARRIVALS_PAYMENT_DATA, {
    variables: {
      streamId: currentUser?.currentChurch.id,
      arrivalsDate: arrivalDate || today,
    },
  })

  const arrivalPaymentData = data?.streams[0]?.arrivalsPaymentData

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <div className="text-center">
          <HeadingPrimary>Arrival's Payment Data</HeadingPrimary>
          <HeadingSecondary>{`${church?.name} ${church?.__typename}`}</HeadingSecondary>
        </div>
        {arrivalPaymentData?.length === 0 ? (
          <NoDataComponent text="No Arrivals Payment Data for Today" />
        ) : (
          <div>
            <div style={{ width: 'auto', overflowX: 'scroll' }}>
              <table className="table table-dark">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Date</th>
                    <th scope="col">Stream</th>
                    <th scope="col">Council</th>
                    <th scope="col">Council Head</th>
                    <th scope="col">Governorship</th>
                    <th scope="col">Bacenta</th>
                    <th scope="col">Leader</th>
                    <th scope="col">Bacenta Code</th>
                    <th scope="col">Attendance</th>
                    <th scope="col">Confirmed Attendance</th>
                    <th scope="col">Vehicle</th>
                    <th scope="col">In and Out</th>
                    <th scope="col">Top Up</th>
                    <th scope="col">Vehicle Cost</th>
                    <th scope="col">Momo Number</th>
                    <th scope="col">Momo Name</th>
                    <th scope="col">Comments</th>
                    <th scope="col">Society</th>
                    <th scope="col">Arrival Time</th>
                  </tr>
                </thead>
                <tbody>
                  {arrivalPaymentData
                    ?.slice(0, 5)
                    ?.map((data: ArrivalPaymentData, index: number) => (
                      <tr key={index}>
                        <th scope="row">{index}</th>
                        <td>{data?.date}</td>
                        <td>{data?.stream}</td>
                        <td>{data?.council}</td>
                        <td>{data?.councilHead}</td>
                        <td>{data?.governorship}</td>
                        <td>{data?.bacenta}</td>
                        <td>{data?.leader}</td>
                        <td>{data?.bacentaCode}</td>
                        <td>{data?.attendance}</td>
                        <td>{data?.confirmedAttendance}</td>
                        <td>{data?.vehicle}</td>
                        <td>{data?.outbound}</td>
                        <td>{data?.topUp}</td>
                        <td>{data?.vehicleCost}</td>
                        <td>{data?.momoNumber}</td>
                        <td>{data?.momoName}</td>
                        <td>{data?.comments}</td>
                        <td>{data?.society}</td>
                        <td>{data?.arrivalTime}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-3">
              <Button>
                <CSVLink
                  filename={`${church?.name} ${
                    church?.__typename
                  } - ${getHumanReadableDate(
                    today
                  )} -  Today's Busses To Be Paid.csv`}
                  headers={headers}
                  data={arrivalPaymentData}
                >
                  {' '}
                  <span className="text-white">Download Data</span>
                </CSVLink>
              </Button>
            </div>
          </div>
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default ArrivalsPaymentData
