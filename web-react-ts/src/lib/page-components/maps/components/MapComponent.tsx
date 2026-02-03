import React, { useCallback, useContext, useMemo, useRef } from 'react'
import {
  useLoadScript,
  GoogleMap,
  Marker,
  MarkerClusterer,
  InfoWindow,
} from '@react-google-maps/api'
import { useState } from 'react'
import '../Map.css'
import {
  Button,
  Card,
  Col,
  Container,
  Offcanvas,
  Row,
  Toast,
} from 'react-bootstrap'
import { IoChevronUp } from 'react-icons/io5'
import { GooglePlaces, MemberPlaces } from '../Places'
import {
  ApolloError,
  LazyQueryExecFunction,
  OperationVariables,
} from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import LoadingScreen from 'components/base-component/LoadingScreen'
import './MapComponent.css'
import {
  MemberMapData,
  Neo4jLocation,
  getMapIcon,
  getMapIconClass,
} from './map-utils'
import CloudinaryImage from 'components/CloudinaryImage'
import { FaChurch, FaDirections, FaLocationArrow } from 'react-icons/fa'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import { ChurchIdAndName } from 'global-types'
import { ChurchContext } from 'contexts/ChurchContext'
import { useRouter } from 'next/navigation'
import { alertMsg, throwToSentry } from 'global-utils'
import { BiGroup } from 'react-icons/bi'
import { ScaleLoader } from 'react-spinners'

type LatLngLiteral = google.maps.LatLngLiteral
type MapOptions = google.maps.MapOptions

type LibrariesOptions = ('places' | 'drawing' | 'geometry' | 'visualization')[]

type MapComponentProps = {
  memberSearch: LazyQueryExecFunction<any, OperationVariables>
  placesSearchByLocation: LazyQueryExecFunction<any, OperationVariables>
  placesSearchByName: LazyQueryExecFunction<any, OperationVariables>
  loadAllUnvisitedMembers?: LazyQueryExecFunction<any, OperationVariables>
  loading: boolean
  error: ApolloError | undefined
}

export type PlaceType = {
  id: string
  name: string
  typename:
    | 'GooglePlace'
    | 'Member'
    | 'Fellowship'
    | 'IndoorVenue'
    | 'OutdoorVenue'
    | 'HighSchool'
  picture?: string
  description?: string
  position: LatLngLiteral
}

const MapComponent = (props: MapComponentProps) => {
  const { loading } = props
  const [libraries] = useState<LibrariesOptions>(['places'])
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries,
  })

  const [show, setShow] = useState(false)
  const [showError, setShowError] = useState(false)
  const [toastError, setToastError] = useState<string>('')
  const [selected, setCentre] = useState<PlaceType>()
  const [clickedMarker, setClickedMarker] = useState<PlaceType>()
  const [places, setPlaces] = useState<PlaceType[]>([])

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const { currentUser } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()

  const mapRef = useRef<GoogleMap>()
  const center = useMemo<LatLngLiteral>(
    () => ({ lat: 5.655949, lng: -0.167033 }),
    []
  )
  const options = useMemo<MapOptions>(
    () => ({
      mapId: 'b0ab33f7a0fc53d5',
      disableDefaultUI: true,
      clickableIcons: true,
      mapTypeId: 'hybrid',
    }),
    []
  )

  const onLoad = useCallback((map: any) => (mapRef.current = map), [])

  const handleMarkerClick = (marker: PlaceType) => {
    setClickedMarker(marker)
  }

  const getTypename = (place: PlaceType) => {
    switch (place.typename) {
      case 'GooglePlace':
        return 'Google Place'
      case 'Member':
        return ''
      case 'Fellowship':
        return 'Fellowship'
      case 'IndoorVenue':
        return 'Indoor Venue'
      case 'OutdoorVenue':
        return 'Outdoor Venue'
      case 'HighSchool':
        return 'High School'
      default:
        return ''
    }
  }

  if (!isLoaded) {
    return <LoadingScreen />
  }

  const searchByLocation = async (position: LatLngLiteral) => {
    const response = await props.placesSearchByLocation({
      variables: {
        id: currentUser.id,
        latitude: position.lat,
        longitude: position.lng,
      },
    })

    return response.data.members[0].placesSearchByLocation.map(
      (place: any) => ({
        ...place,
        position: {
          lat: place.latitude,
          lng: place.longitude,
        },
      })
    )
  }

  const handleSetCentre = async (position: PlaceType) => {
    if (!position.position.lat && !position.position.lng) {
      alertMsg('No location found')
      return
    }

    setCentre(position)
    mapRef.current?.panTo(position.position)
    setPlaces(await searchByLocation(position.position))
    handleClose()
  }

  const handleMyLocationClick = () => {
    window.navigator.geolocation.getCurrentPosition((position) => {
      setCentre({
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        name: 'Your Location',
        typename: 'Fellowship',
        id: 'fellowship',
      })
      mapRef.current?.panTo({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    })

    handleClose()
  }

  const handleFlcClick = async () => {
    const position = { lat: 5.655949, lng: -0.167033 }
    setCentre({
      position,
      name: 'First Love Center',
      typename: 'Fellowship',
      id: 'fellowship',
    })
    setPlaces(await searchByLocation(position))
    mapRef.current?.panTo(position)
    handleClose()
  }

  const loadAllMembers = async () => {
    const { loadAllUnvisitedMembers } = props

    try {
      if (loadAllUnvisitedMembers) {
        const response = await loadAllUnvisitedMembers({
          variables: {
            id: currentUser.id,
          },
        })

        if (response.error) {
          setToastError(response.error.message)
          setShowError(true)
        }
        const position = { lat: 5.655949, lng: -0.167033 }
        setCentre({
          position,
          name: 'First Love Center',
          typename: 'Fellowship',
          id: 'fellowship',
        })

        setPlaces(
          response.data.members[0].memberLoadCouncilUnvisitedMembers.map(
            (place: any) => ({
              ...place,
              position: {
                lat: place.latitude,
                lng: place.longitude,
              },
            })
          )
        )

        return response.data.members[0].memberLoadCouncilUnvisitedMembers.map(
          (place: any) => ({
            ...place,
            position: {
              lat: place.latitude,
              lng: place.longitude,
            },
          })
        )
      }
    } catch (err: any) {
      throwToSentry('', err)
    } finally {
      handleClose()
    }
  }

  const parseMemberDesc = (description: string) => {
    const parsedDesc: {
      member: MemberMapData
      fellowship: {
        id: string
        name: string
        location: { x: number; y: number }
      }
      council: ChurchIdAndName
      pastor: MemberMapData
      phoneNumber: string
      whatsappNumber: string
    } = JSON.parse(description)

    const { member, fellowship, council, pastor, phoneNumber, whatsappNumber } =
      parsedDesc

    return (
      <>
        <p
          className="mb-2"
          onClick={() => {
            handleSetCentre({
              id: fellowship.id,
              name: fellowship.name,
              typename: 'Fellowship',
              position: {
                lat: fellowship.location.y,
                lng: fellowship.location.x,
              },
            })
          }}
        >
          <span className="fw-bold">Fellowship:</span> {fellowship.name}
        </p>
        <p className="mb-2">
          <span className="fw-bold">Council:</span> {council.name}
        </p>
        <p className="mb-2">
          <span className="fw-bold">Pastor:</span> {pastor.firstName}{' '}
          {pastor.lastName}
        </p>
        <Row className="mb-2">
          <Col className="col-auto p-0">
            <a href={`tel:${phoneNumber}`}>
              <Button size="sm" variant="primary">
                <TelephoneFill /> Call
              </Button>
            </a>
          </Col>

          <Col className="col-auto">
            <a href={`https://wa.me/${whatsappNumber}`}>
              <Button size="sm" variant="success">
                <Whatsapp /> WhatsApp
              </Button>
            </a>
          </Col>
        </Row>
        <Card.Footer>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              clickCard({ id: member.id, __typename: 'Member' })
              router.push('/member/displaydetails')
            }}
          >
            View Member Profile
          </Button>

          <Button
            size="sm"
            className="mt-2"
            variant="outline-info"
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${member.location.y}%2C${member.location.x}`
              )
            }
          >
            Get Directions <FaDirections />
          </Button>
        </Card.Footer>
      </>
    )
  }

  const parseFellowshipDesc = (description: string) => {
    const parsedDesc: {
      fellowship: {
        id: string
        name: string
        location: Neo4jLocation
      }
      council: ChurchIdAndName
      fellowshipLeader: MemberMapData
      councilLeader: MemberMapData
    } = JSON.parse(description)

    const { fellowship, council, fellowshipLeader, councilLeader } = parsedDesc

    return (
      <>
        <p
          className="mb-2"
          onClick={() => {
            handleSetCentre({
              id: fellowshipLeader.id,
              name:
                fellowshipLeader.firstName + ' ' + fellowshipLeader.lastName,
              typename: 'Fellowship',
              position: {
                lat: fellowshipLeader.location?.y,
                lng: fellowshipLeader.location?.x,
              },
            })
          }}
        >
          <span className="fw-bold">Fellowship Leader:</span>{' '}
          {fellowshipLeader.firstName} {fellowshipLeader.lastName}
        </p>
        <p
          className="mb-2"
          onClick={() => {
            handleSetCentre({
              id: fellowshipLeader.id,
              name:
                fellowshipLeader.firstName + ' ' + fellowshipLeader.lastName,
              typename: 'Member',
              position: {
                lat: fellowshipLeader.location?.y,
                lng: fellowshipLeader.location?.x,
              },
            })
          }}
        >
          <span className="fw-bold">Fellowship:</span> {fellowship.name}
        </p>
        <p className="mb-2">
          <span className="fw-bold">Council:</span> {council.name}
        </p>
        <p className="mb-2">
          <span className="fw-bold">Council Leader:</span>{' '}
          {councilLeader.firstName} {councilLeader.lastName}
        </p>
        <Row className="mb-2">
          <Col className="col-auto">
            <a href={`tel:${fellowshipLeader.phoneNumber}`}>
              <Button size="sm" variant="primary">
                <TelephoneFill /> Call
              </Button>
            </a>
          </Col>
          <Col className="col-auto">
            <a href={`https://wa.me/${fellowshipLeader.whatsappNumber}`}>
              <Button size="sm" variant="success">
                <Whatsapp /> WhatsApp
              </Button>
            </a>
          </Col>
        </Row>
        <Card.Footer>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              clickCard({ id: fellowship.id, __typename: 'Fellowship' })
              router.push('/fellowship/displaydetails')
            }}
          >
            View Fellowship Profile
          </Button>

          <Button
            size="sm"
            className="mt-2"
            variant="outline-info"
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${fellowship.location.y}%2C${fellowship.location.x}`
              )
            }
          >
            Get Directions <FaDirections />
          </Button>
        </Card.Footer>
      </>
    )
  }

  const parseVenueDesc = (description: string) => {
    const parsedDesc: {
      venue: {
        id: string
        name: string
        capacity: { low: number }
      }
      category: 'Outdoor' | 'Indoor'
    } = JSON.parse(description)

    const { venue, category } = parsedDesc

    return (
      <>
        <p className="mb-2">
          <span className="fw-bold">Capacity:</span>{' '}
          {venue.capacity?.low ?? venue.capacity}
        </p>
        <p className="mb-2">
          <span className="fw-bold">Category:</span> {category}
        </p>
        <p className="mb-2">
          <span className="fw-bold">Area:</span> {venue.name}
        </p>
      </>
    )
  }

  const chooseParsingFunction = (place: PlaceType) => {
    switch (place.typename) {
      case 'Member':
        return parseMemberDesc(place.description ?? '')
      case 'Fellowship':
        return parseFellowshipDesc(place.description ?? '')
      case 'IndoorVenue':
      case 'OutdoorVenue':
        return parseVenueDesc(place.description ?? '')
      default:
        return ''
    }
  }

  return (
    <div className="map">
      <GoogleMap
        zoom={18}
        center={center}
        mapContainerClassName="map-container"
        options={options}
        onLoad={onLoad}
      >
        {selected && (
          <>
            <Marker
              position={selected.position}
              label={{
                text: selected.name,
                className: 'marker selected ' + getMapIconClass(selected),
              }}
              onClick={() => handleMarkerClick(selected)}
            />
            {clickedMarker && (
              <InfoWindow
                position={clickedMarker.position}
                onCloseClick={() => setClickedMarker(undefined)}
              >
                <Card>
                  <Card.Body>
                    <Row>
                      {clickedMarker.picture && (
                        <Col>
                          <CloudinaryImage
                            src={clickedMarker.picture}
                            className="rounded"
                          />
                        </Col>
                      )}
                      <Col>
                        <p className="fw-bold info-window-header">{`${getTypename(
                          clickedMarker
                        )} ${clickedMarker.name}`}</p>
                        <div className="info-window-text">
                          {chooseParsingFunction(clickedMarker ?? '')}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </InfoWindow>
            )}
            <MarkerClusterer>
              {(clusterer) => (
                <div>
                  {places.map((place, index) => {
                    if (index === 0) return null

                    return (
                      <Marker
                        key={place.id}
                        label={{
                          text: place.name + ' ' + getTypename(place),
                          className: 'marker ' + getMapIconClass(place),
                        }}
                        position={place.position}
                        clusterer={clusterer}
                        icon={getMapIcon(place)}
                        onClick={() => handleMarkerClick(place)}
                      />
                    )
                  })}
                </div>
              )}
            </MarkerClusterer>
          </>
        )}
      </GoogleMap>

      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="bottom"
        className="offcanvas"
      >
        <Offcanvas.Header closeButton className="dark">
          <Offcanvas.Title>Maps Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="dark">
          <div>Search for a place</div>
          <GooglePlaces
            handleClose={handleClose}
            setCentre={handleSetCentre}
            {...props}
          />
          <div>Search our FLC Database</div>
          <MemberPlaces
            handleClose={handleClose}
            setCentre={handleSetCentre}
            {...props}
          />
          <Row className="mt-4">
            <Col>
              <div>Go to your location</div>
              <Button
                onClick={handleMyLocationClick}
                variant="dark"
                className="map-btn"
              >
                My location <FaLocationArrow />
              </Button>
            </Col>
            <Col>
              <div>Go to First Love Center</div>
              <Button
                onClick={handleFlcClick}
                variant="dark"
                className="map-btn"
              >
                First Love Center <FaChurch />
              </Button>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col>
              <div>Load All My Unvisited Members</div>
              <Button
                onClick={loadAllMembers}
                variant="dark"
                className="map-btn"
              >
                <BiGroup className="me-2" />
                Load Members
              </Button>
            </Col>
          </Row>

          {loading && (
            <Container className="mt-5 d-flex flex-column justify-content-center align-items-center">
              <ScaleLoader color="gray" />
            </Container>
          )}
        </Offcanvas.Body>
        <Container className="footer p-3">
          <Toast
            show={showError}
            onClose={() => setShowError(false)}
            bg="danger"
          >
            <Toast.Header>
              <img
                src="holder.js/20x20?text=%20"
                className="rounded me-2"
                alt=""
              />
              <strong className="me-auto">Error</strong>
            </Toast.Header>
            <Toast.Body>{toastError}</Toast.Body>
          </Toast>
        </Container>
      </Offcanvas>
      <div className="floating-action">
        <Button
          variant="primary"
          onClick={handleShow}
          className="rounded-circle"
        >
          <IoChevronUp />
        </Button>
      </div>
    </div>
  )
}

export default MapComponent
