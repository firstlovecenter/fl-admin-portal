import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import CloudinaryImage from 'components/CloudinaryImage'
import { Church, ChurchLevel } from 'global-types'
import { USER_PLACEHOLDER } from 'global-utils'
import StatDisplay from 'pages/services/graphs/CompStatDisplay'
import { getMonthlyStatAverage } from 'pages/services/graphs/graphs-utils'
import { Row, Col } from 'react-bootstrap'

type MultiplicationCampaignServiceTrendsProps = {
  church: Church
  churchData: any
  churchType: ChurchLevel
}
const MultiplicationCampaignServiceTrends = ({
  church,
  churchData,
  churchType,
}: MultiplicationCampaignServiceTrendsProps) => {
  return (
    <div>
      <Row className="mb-3 mt-4">
        <Col xs={4}>
          <CloudinaryImage
            src={church?.leader?.pictureUrl || USER_PLACEHOLDER}
            className="img-trends bg-secondary m-2 rounded-circle"
          />
        </Col>

        <Col className="my-auto mx-auto">
          <h5 className="mb-0 d-block">{`${church?.leader?.firstName} ${church?.leader?.lastName}`}</h5>

          <span className="text-secondary font-weight-bold">
            {`${church?.name} ${churchType}`}
          </span>
        </Col>
      </Row>

      <Row className="mt-2">
        <Col>
          <StatDisplay
            title={`Avg Attendance`}
            statistic={getMonthlyStatAverage(churchData, 'attendance')}
          />
        </Col>

        <Col>
          <StatDisplay
            title="Avg Income"
            statistic={getMonthlyStatAverage(churchData, 'income')}
          />
        </Col>
      </Row>

      <ChurchGraph
        stat1="attendance"
        stat2="income"
        churchData={churchData || []}
        church={churchType.toLowerCase()}
        graphType="services"
        income={true}
      />
    </div>
  )
}

export default MultiplicationCampaignServiceTrends
