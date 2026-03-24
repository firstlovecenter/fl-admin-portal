import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceRecord } from 'global-types'
import { throwToSentry } from 'global-utils'
import { parseDate } from 'jd-date-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import React, { useContext } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import { GOVERNORSHIP_BANKING_SLIP_QUERIES } from '../../ServicesQueries'
import { Card, CardContent, CardHeader } from 'components/ui/card'

const GovernorshipBankingSlipView = () => {
  const { governorshipId, clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const { data, loading, error } = useQuery(GOVERNORSHIP_BANKING_SLIP_QUERIES, {
    variables: { governorshipId: governorshipId },
  })
  const governorship = data?.governorships[0]
  const placeholder = ['', '', '']
  throwToSentry('', error)

  return (
    <div>
      <HeadingPrimary loading={loading}>{governorship?.name}</HeadingPrimary>

      {data?.governorships[0].services.map(
        (service: ServiceRecord, index: number) => {
          if (
            service.noServiceReason ||
            service.transactionStatus === 'success'
          ) {
            if (index === 0) {
              return (
                <NoDataComponent text="No services to bank. When you have a service, it will show up here" />
              )
            }

            return null
          }

          return (
            <Card
              key={service.id}
              className="mb-2"
              onClick={() => {
                clickCard(service)

                navigate('/governorship/service-details')
              }}
            >
              <CardHeader>
                <b>{parseDate(service.serviceDate.date)}</b>
              </CardHeader>
              <CardContent>
                <div>
                  <div>
                    <span>Offering: {service.income}</span>
                  </div>
                  <div className="col-auto">
                    {service.bankingSlip ? (
                      <span className="text-success fw-bold">
                        <CheckCircle2 color="green" size={35} /> Filled
                      </span>
                    ) : (
                      <span className="text-danger fw-bold">
                        <XCircle color="red" size={35} /> Not Filled
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        }
      )}

      {loading &&
        placeholder.map((service, index) => {
          return (
            <Card key={index} className="mb-2">
              <CardHeader>
                <PlaceholderCustom as="p" loading={loading}></PlaceholderCustom>
              </CardHeader>
              <CardContent>
                <div>
                  <div>
                    <PlaceholderCustom
                      as="span"
                      loading={loading}
                    ></PlaceholderCustom>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
    </div>
  )
}

export default GovernorshipBankingSlipView
