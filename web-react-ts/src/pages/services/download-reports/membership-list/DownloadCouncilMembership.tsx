import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Button, Container } from 'react-bootstrap'
import { DISPLAY_COUNCIL_MEMBERSHIP } from './DownloadMembership.gql'
import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Council, Member } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { CSVLink } from 'react-csv'
import { getHumanReadableDate } from '@jaedag/admin-portal-types'
import { ArrowDownCircle } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'

const formatDate = (dateString: string) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  const day = date.getDate()
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const month = monthNames[date.getMonth()] // getMonth() returns 0-based month

  return `${day} ${month}`
}

const DownloadCouncilMembership = () => {
  const { councilId } = useContext(ChurchContext)
  const today = new Date().toISOString().slice(0, 10).toString()
  const headers = [
    { label: 'Council', key: 'council' },
    { label: 'Constituency', key: 'constituency' },
    { label: 'Constituency Leader', key: 'constituencyLeader' },
    { label: 'Bacenta', key: 'bacenta' },
    { label: 'Bacenta Leader', key: 'bacentaLeader' },
    { label: 'First Name', key: 'firstName' },
    { label: 'Last Name', key: 'lastName' },
    { label: 'Phone Number', key: 'phoneNumber' },
    { label: 'Whatsapp Number', key: 'whatsappNumber' },
    { label: 'Email', key: 'email' },
    { label: 'Marital Status', key: 'maritalStatus' },
    { label: 'Gender', key: 'gender' },
    { label: 'Date of Birth', key: 'dateOfBirth' },
    { label: 'Visitation Area', key: 'visitationArea' },
  ]

  const { data, loading, error } = useQuery(DISPLAY_COUNCIL_MEMBERSHIP, {
    variables: { id: councilId },
  })
  const navigate = useNavigate()

  const council: Council = data?.councils[0]
  const membersData = council?.members.map((member: Member) => ({
    council: council.name,
    constituency: member.bacenta.constituency.name,
    constituencyLeader: member.bacenta.constituency.leader.fullName,
    bacenta: member.bacenta.name,
    bacentaLeader: member.bacenta.leader.fullName,
    firstName: member.firstName,
    lastName: member.lastName,
    phoneNumber: member.phoneNumber,
    whatsappNumber: member.whatsappNumber,
    email: member.email,
    maritalStatus: member.maritalStatus.status,
    gender: member.gender.gender,
    dateOfBirth: formatDate(member.dob?.date),
    visitationArea: member.visitationArea,
  }))

  if (council?.downloadCredits <= 0 || !council?.downloadCredits) {
    return (
      <Container>
        <HeadingPrimary>
          You have exhausted your download credits for {council?.name} Council
        </HeadingPrimary>
        <Button
          onClick={() => navigate('/download-reports/council/purchase-credits')}
        >
          Purchase More
        </Button>
      </Container>
    )
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>
          Download {council?.name} Council Membership
        </HeadingPrimary>

        {membersData?.length === 0 && (
          <NoDataComponent text="There is no membership data to download" />
        )}

        {membersData?.length > 0 && (
          <>
            <Button variant="outline-success" className="mb-3">
              <CSVLink
                data={membersData}
                headers={headers}
                filename={`${
                  council?.name
                } Council Membership - ${getHumanReadableDate(today)} .csv`}
              >
                <span className="text-success">
                  Download CSV <ArrowDownCircle />
                </span>
              </CSVLink>
            </Button>
            <div style={{ width: 'auto', overflowX: 'scroll' }}>
              <table className="table table-dark">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Council</th>
                    <th scope="col">Constituency</th>
                    <th scope="col">Constituency Leader</th>
                    <th scope="col">Bacenta</th>
                    <th scope="col">Bacenta Leader</th>
                    <th scope="col">First Name</th>
                    <th scope="col">Last Name</th>
                    <th scope="col">Phone Number</th>
                    <th scope="col">Whatsapp Number</th>
                    <th scope="col">Email</th>
                    <th scope="col">Marital Status</th>
                    <th scope="col">Birthday</th>
                    <th scope="col">Visitation Area</th>
                  </tr>
                </thead>
                <tbody>
                  {membersData?.slice(0, 5)?.map((data, index: number) => (
                    <tr key={index}>
                      <th scope="row">{index}</th>
                      <td>{data?.council}</td>
                      <td>{data?.constituency}</td>
                      <td>{data?.constituencyLeader}</td>
                      <td>{data?.bacenta}</td>
                      <td>{data?.bacentaLeader}</td>
                      <td>{data?.firstName}</td>
                      <td>{data?.lastName}</td>
                      <td>{data?.phoneNumber}</td>
                      <td>{data?.whatsappNumber}</td>
                      <td>{data?.email}</td>
                      <td>{data?.maritalStatus}</td>
                      <td>{data?.dateOfBirth}</td>
                      <td>{data?.visitationArea}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default DownloadCouncilMembership