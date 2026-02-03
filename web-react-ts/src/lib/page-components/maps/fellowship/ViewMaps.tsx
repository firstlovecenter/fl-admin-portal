import { useLazyQuery } from '@apollo/client'
import { MEMBER_MEMBER_SEARCH } from 'components/formik/SearchMemberQueries'
import MapComponent from '../components/MapComponent'
import {
  LOAD_COUNCIL_UNVISITED_MEMBERS,
  MEMBER_PLACES_SEARCH_BY_LOCATION,
  MEMBER_PLACES_SEARCH_BY_NAME,
} from './GeoQueries'
import { isAuthorised } from '@jaedag/admin-portal-types'
import { useContext } from 'react'
import { MemberContext } from 'contexts/MemberContext'

const ViewMaps = () => {
  const { currentUser } = useContext(MemberContext)
  const [memberSearch] = useLazyQuery(MEMBER_MEMBER_SEARCH)
  const [
    placesSearchByLocation,
    { loading: locationLoading, error: locationError },
  ] = useLazyQuery(MEMBER_PLACES_SEARCH_BY_LOCATION)
  const [placesSearchByName, { loading: nameLoading, error: nameError }] =
    useLazyQuery(MEMBER_PLACES_SEARCH_BY_NAME)
  const [
    loadCouncilUnvisitedMembers,
    { loading: unvisitedMembersLoading, error: unvisitedMembersError },
  ] = useLazyQuery(LOAD_COUNCIL_UNVISITED_MEMBERS)

  const loading = locationLoading || nameLoading || unvisitedMembersLoading
  const error = locationError || nameError || unvisitedMembersError

  let loadUnvisitedMembers

  if (isAuthorised(['adminCouncil', 'leaderCouncil'], currentUser.roles)) {
    loadUnvisitedMembers = loadCouncilUnvisitedMembers
  }

  return (
    <MapComponent
      memberSearch={memberSearch}
      placesSearchByLocation={placesSearchByLocation}
      placesSearchByName={placesSearchByName}
      loadAllUnvisitedMembers={loadUnvisitedMembers}
      loading={loading}
      error={error}
    />
  )
}

export default ViewMaps
