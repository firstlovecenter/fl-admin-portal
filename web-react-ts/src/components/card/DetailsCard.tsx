import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Badge } from 'components/ui/badge'
import { Card } from 'components/ui/card'
import './DetailsCard.css'

type DetailsCardPropsType = {
  subtitle?: string
  avatar?: string
  heading?: string
  loading?: boolean
  detail?: string
  onClick?: () => void
  bgNone?: boolean
  img?: string
  creativearts?: boolean
  vacationCount?: string
  vacationIcBacentaCount?: string
  leading?: JSX.Element
  trailing?: JSX.Element
}

const DetailsCard = (props: DetailsCardPropsType) => {
  const { currentUser } = useContext(MemberContext)
  const { leading, trailing, detail, heading, onClick, creativearts } = props
  const loading = !heading || props.loading || !currentUser.id || !detail

  return (
    <Card
      className={`p-2 m-1 cursor-pointer ${creativearts ? 'creativearts' : ''}`}
      onClick={onClick}
    >
      <div className="flex">
        <div className="flex-1">
          <PlaceholderCustom loading={loading} as="span" xs={12}>
            <span className="text-muted-foreground text-sm">{heading}</span>
          </PlaceholderCustom>
          <PlaceholderCustom loading={loading} as="h2" xs={12}>
            <div className="flex justify-between items-center">
              {!!leading && <>{leading}</>}
              <h3 className="card-detail truncate">
                {detail?.replace(currentUser.currency, '')}{' '}
                <small>{detail?.match(currentUser.currency)}</small>
              </h3>
              {!!trailing && <>{trailing}</>}
              {heading === 'Reds' && props?.vacationIcBacentaCount !== '0' && (
                <div>
                  <Badge variant="danger" className="badge-vacation mt-auto">
                    <span>{`+ `}</span>
                    {`${props?.vacationIcBacentaCount} on Vacation`}
                  </Badge>
                </div>
              )}
              {parseFloat(props?.vacationCount?.toString() || '0') !== 0.0 && (
                <div>
                  <Badge variant="danger" className="badge-vacation mt-auto">
                    <span>{`+ `}</span>
                    {`${props?.vacationCount} on Vacation`}
                  </Badge>
                </div>
              )}
            </div>
          </PlaceholderCustom>
        </div>
      </div>
    </Card>
  )
}

export default DetailsCard
