import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import TabletDesktopView from '../responsive-design/TabletDesktopView'
import MobileView from '../responsive-design/MobileView'
import { ChurchContext } from 'contexts/ChurchContext'
import { USER_PLACEHOLDER } from 'global-utils'
import PlaceholderCustom from 'components/Placeholder'
import './MemberTable.css'
import { MemberContext } from 'contexts/MemberContext'
import { Container } from 'react-bootstrap'
import CloudinaryImage from 'components/CloudinaryImage'

const MemberTable = (props) => {
  const { data, error, loading, offset, numberOfRecords } = props

  const { clickCard } = useContext(ChurchContext)
  const { theme } = useContext(MemberContext)
  const navigate = useNavigate()

  const pageLoading = loading || error || !data

  if (pageLoading) {
    return (
      <MobileView>
        <div className="member-grid">
          {[0, 1, 2, 3, 4, 5].map((_, index) => {
            return (
              <Container key={index}>
                <div
                  className={`d-flex align-items-center card-border ${theme}`}
                >
                  <PlaceholderCustom
                    className="rounded-circle img-search-placeholder"
                    as="div"
                    xs={12}
                    loading={pageLoading}
                  />

                  <div className="flex-grow-1 ms-3">
                    <PlaceholderCustom
                      loading={pageLoading}
                      as="span"
                      xs={12}
                    />
                    <PlaceholderCustom
                      loading={pageLoading}
                      as="span"
                      xs={12}
                    />
                  </div>
                </div>
              </Container>
            )
          })}
        </div>
      </MobileView>
    )
  }

  return (
    // Web View Full Screen without filters applied
    <>
      <TabletDesktopView>
        <div className="container member-grid">
          <div className="row">
            {data.map((soul, index) => {
              if (index < offset) {
                return null
              } else if (index >= offset + numberOfRecords - 1) {
                return null
              }
              return (
                <div className="col-auto " key={index}>
                  <div
                    className="card grid-card fade-in"
                    onClick={() => {
                      clickCard(soul)
                      navigate('/member/displaydetails')
                    }}
                  >
                    <CloudinaryImage
                      className="card-img-top"
                      src={soul?.pictureUrl || USER_PLACEHOLDER}
                      alt={soul?.firstName + ' ' + soul?.lastName}
                    />

                    <p className="text-center pt-2">
                      {soul?.firstName + ' ' + soul?.lastName}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </TabletDesktopView>

      {/* Mobile View */}
      <MobileView>
        <div className="member-grid">
          {data.map((soul, index) => {
            return (
              <Container key={index}>
                <div
                  className={`d-flex align-items-center card-border ${theme}`}
                  onClick={() => {
                    clickCard(soul)
                    navigate('/member/displaydetails')
                  }}
                >
                  <div className="flex-shrink-0">
                    <CloudinaryImage
                      className="rounded-circle img-search"
                      src={soul?.pictureUrl}
                      // alt attribute messes with the lazy loading feature of the cloudinary sdk
                      // alt={soul?.firstName + ' ' + soul?.lastName}
                    />
                  </div>

                  <div className="flex-grow-1 ms-3">
                    <p className="card-title">{`${soul?.firstName} ${soul?.lastName}`}</p>
                    {soul?.bacenta ? (
                      <span className={`text-secondary card-subinfo ${theme}`}>
                        {soul?.bacenta.name}
                        {' - '}
                      </span>
                    ) : null}
                    {soul?.basonta && (
                      <span className={`text-secondary card-subinfo ${theme}`}>
                        {soul?.basonta.name}
                      </span>
                    )}
                  </div>
                </div>
              </Container>
            )
          })}
        </div>
      </MobileView>
    </>
  )
}

export default MemberTable
