import CloudinaryImage from 'components/CloudinaryImage'
import { Church } from 'global-types'
import React from 'react'
import { Button } from 'react-bootstrap'
import '../../directory/quick-facts/QuickFacts.css'

type churchBelow = {
  name: string
  number: number
  onClick?: () => void
}

type SwollenSundayLandingPageProps = {
  churchBelow: churchBelow[]
  church: Church
}

export type SwellBussingRecords = {
  id: string
  attendance: number
  date: string
  target: number
}

const SwollenSundayTrends = ({
  churchBelow,
  church,
}: SwollenSundayLandingPageProps) => {
  return (
    <div>
      <div className="text-end ">
        <h6 className="d-inline-block">{`${church?.leader?.firstName} ${church?.leader?.lastName}`}</h6>
        <CloudinaryImage
          src={church?.leader?.pictureUrl}
          className="img-swollen-sunday bg-secondary m-2 rounded-circle "
        />
      </div>
      <div className="container mb-4 card-button-row text-center">
        <table>
          <tbody>
            <tr>
              {churchBelow.map((church, index) => (
                <td className="col-auto px-1" key={index}>
                  <div key={index}>
                    <Button
                      variant="dark"
                      className="card-width mb-3 mt-2"
                      size="lg"
                      onClick={church.onClick}
                    >
                      <div>
                        <h6 className="text-secondary">{church.name}</h6>
                        <h1>{church.number}</h1>
                      </div>
                    </Button>{' '}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SwollenSundayTrends
