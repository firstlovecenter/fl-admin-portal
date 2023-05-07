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
import { Button, Col, Container, Offcanvas, Row } from 'react-bootstrap'
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
import { getMapIcon, getMapIconClass } from './map-utils'
import CloudinaryImage from 'components/CloudinaryImage'
import { FaChurch, FaLocationArrow } from 'react-icons/fa'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import { ChurchIdAndName } from 'global-types'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import { alertMsg } from 'global-utils'

type LatLngLiteral = google.maps.LatLngLiteral
type MapOptions = google.maps.MapOptions

type LibrariesOptions = (
  | 'places'
  | 'drawing'
  | 'geometry'
  | 'localContext'
  | 'visualization'
)[]

type MapComponentProps = {
  memberSearch: LazyQueryExecFunction<any, OperationVariables>
  placesSearchByLocation: LazyQueryExecFunction<any, OperationVariables>
  placesSearchByName: LazyQueryExecFunction<any, OperationVariables>
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
  const [libraries] = useState<LibrariesOptions>(['places'])
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    libraries,
  })

  const [show, setShow] = useState(false)
  const [selected, setCentre] = useState<PlaceType>()
  const [clickedMarker, setClickedMarker] = useState<PlaceType>()
  const [places, setPlaces] = useState<PlaceType[]>([])

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const { currentUser } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

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
    if (position.position.lat === 0 && position.position.lng === 0) {
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
      position: position,
      name: 'First Love Center',
      typename: 'Fellowship',
      id: 'fellowship',
    })
    setPlaces(await searchByLocation(position))
    mapRef.current?.panTo(position)
    handleClose()
  }

  const parseDescription = (description: string) => {
    const parsedDesc: {
      fellowship: {
        id: string
        name: string
        location: { x: number; y: number }
      }
      council: ChurchIdAndName
      pastor: { firstName: string; lastName: string }
      phoneNumber: string
      whatsappNumber: string
    } = JSON.parse(description)

    const { fellowship, council, pastor, phoneNumber, whatsappNumber } =
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
        <p className="mb-2">
          <a href={`tel:${phoneNumber}`}>
            <Button size="sm" variant="primary">
              <TelephoneFill /> Call
            </Button>
          </a>
        </p>
        <p className="mb-2">
          <a href={`https://wa.me/${whatsappNumber}`}>
            <Button size="sm" variant="success">
              <Whatsapp /> WhatsApp
            </Button>
          </a>
        </p>
      </>
    )
  }

  return (
    <div className={`map`}>
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
                <Container>
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
                      <p className="info-window-header">{`${getTypename(
                        clickedMarker
                      )} ${clickedMarker.name}`}</p>
                      <div className="info-window-text">
                        {parseDescription(clickedMarker.description ?? '')}
                      </div>
                    </Col>
                  </Row>
                </Container>
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
            <div>Go to your location</div>
            <Container>
              <Button
                onClick={handleMyLocationClick}
                variant="dark"
                className="map-btn"
              >
                My location <FaLocationArrow />
              </Button>
            </Container>
          </Row>
          <Row className="mt-4">
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
        </Offcanvas.Body>
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
