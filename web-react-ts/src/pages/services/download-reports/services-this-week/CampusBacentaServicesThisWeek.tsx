import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Button, Container, Table } from 'react-bootstrap'
import { CAMPUS_BACENTA_SERVICES_THIS_WEEK } from './reportsServicesThisWeek'
import { Bacenta, ServiceRecord } from 'global-types'
import { CSVLink } from 'react-csv'

const CampusBacentaServicesThisWeek = () => {
  const { campusId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(CAMPUS_BACENTA_SERVICES_THIS_WEEK, {
    variables: {
      id: campusId,
    },
  })
  const campus = data?.campuses[0]

  const csvHeaders = [
    { label: 'Date', key: 'date' },
    { label: 'Bacenta Name', key: 'bacenta' },
    { label: 'Attendance', key: 'attendance' },
    { label: 'Income', key: 'income' },
  ]

  const csvData = campus?.servicesThisWeek.map((bacenta: Bacenta) =>
    bacenta?.services.map((service: ServiceRecord) => ({
      date: service.serviceDate.date,
      bacenta: bacenta.name,
      attendance: service.attendance,
      income: service.income,
    }))
  )

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{campus?.name} Campus Download Reports</HeadingPrimary>

        <Button variant="outline-primary">
          <CSVLink
            filename="Bacenta Services This Week"
            headers={csvHeaders}
            data={csvData}
          >
            Export CSV
          </CSVLink>
        </Button>

        <Table variant="dark" striped bordered hover>
          <thead>
            <tr>
              <th>Date</th>
              <th>Bacenta Name</th>
              <th>Attendance</th>
              <th>Income</th>
            </tr>
          </thead>
          <tbody>
            {campus?.servicesThisWeek.map((bacenta: Bacenta) =>
              bacenta?.services.map((service: ServiceRecord) => (
                <tr key={service.id}>
                  <td>{service.serviceDate.date}</td>
                  <td>{bacenta.name}</td>
                  <td>{service.attendance}</td>
                  <td>{service.income}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Container>
    </ApolloWrapper>
  )
}

export default CampusBacentaServicesThisWeek
