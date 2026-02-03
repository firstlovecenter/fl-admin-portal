import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import { Button, Container } from 'react-bootstrap'
import {
  DISPLAY_COUNCIL_MEMBERSHIP,
  REMOVE_DOWNLOAD_CREDIT,
} from './DownloadMembership.gql'
import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Council, Member } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { CSVLink } from 'react-csv'
import { getHumanReadableDate } from '@jaedag/admin-portal-types'
import { ArrowDownCircle } from 'react-bootstrap-icons'
import CheckDownloadCredits from '../CheckDownloadCredits'

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
    { label: 'Governorship', key: 'governorship' },
    { label: 'Governorship Leader', key: 'governorshipLeader' },
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
    { label: 'Basonta', key: 'basonta' },
  ]

  const { data, loading, error } = useQuery(DISPLAY_COUNCIL_MEMBERSHIP, {
    variables: { id: councilId },
  })
  const [RemoveDownloadCredit] = useMutation(REMOVE_DOWNLOAD_CREDIT)

  const council: Council = data?.councils[0]
  const membersData = council?.downloadMembership.map((member: Member) => ({
    council: council.name,
    governorship: member.bacenta.governorship.name,
    governorshipLeader: member.bacenta.governorship.leader.fullName,
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
    basonta: member.basonta?.name,
  }))

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <CheckDownloadCredits church={data?.councils[0]}>
          <HeadingPrimary>
            Download {council?.name} Council Membership
          </HeadingPrimary>

          {membersData?.length === 0 && (
            <NoDataComponent text="There is no membership data to download" />
          )}

          {membersData?.length > 0 && (
            <>
              <Button
                variant="outline-success"
                className="mb-3"
                onClick={() => {
                  RemoveDownloadCredit({ variables: { churchId: councilId } })
                }}
              >
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
                      <th scope="col">Governorship</th>
                      <th scope="col">Governorship Leader</th>
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
                      <th scope="col">Basonta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersData?.slice(0, 5)?.map((data, index: number) => (
                      <tr key={index}>
                        <th scope="row">{index}</th>
                        <td>{data?.council}</td>
                        <td>{data?.governorship}</td>
                        <td>{data?.governorshipLeader}</td>
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
                        <td>{data?.basonta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CheckDownloadCredits>
      </Container>
    </ApolloWrapper>
  )
}

export default DownloadCouncilMembership
