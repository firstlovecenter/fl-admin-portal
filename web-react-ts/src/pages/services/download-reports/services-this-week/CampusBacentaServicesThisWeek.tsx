import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Bacenta, ServiceRecord } from 'global-types'
import { CSVLink } from 'react-csv'
import { Button } from 'components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
import { CAMPUS_BACENTA_SERVICES_THIS_WEEK } from './reportsServicesThisWeek'

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
      <div className="mx-auto w-full max-w-screen-lg space-y-4 px-4">
        <HeadingPrimary>{campus?.name} Campus Download Reports</HeadingPrimary>

        <Button asChild variant="outline">
          <CSVLink
            filename="Bacenta Services This Week"
            headers={csvHeaders}
            data={csvData}
          >
            Export CSV
          </CSVLink>
        </Button>

        <Table className="border [&_td]:border [&_td]:border-border [&_th]:border [&_th]:border-border [&_tr:nth-child(even)]:bg-muted/40">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bacenta Name</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Income</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campus?.servicesThisWeek.map((bacenta: Bacenta) =>
              bacenta?.services.map((service: ServiceRecord) => (
                <TableRow key={service.id}>
                  <TableCell>{service.serviceDate.date}</TableCell>
                  <TableCell>{bacenta.name}</TableCell>
                  <TableCell>{service.attendance}</TableCell>
                  <TableCell>{service.income}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </ApolloWrapper>
  )
}

export default CampusBacentaServicesThisWeek
