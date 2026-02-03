import { LazyQueryExecFunction, OperationVariables } from '@apollo/client'
import GooglePlacesCombobox from './components/GooglePlacesCombobox'
import { PlaceType } from './components/MapComponent'
import MemberPlacesCombobox from './components/MemberPlacesCombobox'

type GooglePlacesProps = {
  setCentre: (position: PlaceType) => void
  handleClose: () => void
}

type MemberPlacesProps = {
  handleClose: () => void
  setCentre: (position: PlaceType) => void
  memberSearch: LazyQueryExecFunction<any, OperationVariables>
  placesSearchByLocation: LazyQueryExecFunction<any, OperationVariables>
  placesSearchByName: LazyQueryExecFunction<any, OperationVariables>
}

export const GooglePlaces = ({ setCentre, handleClose }: GooglePlacesProps) => {
  return (
    <GooglePlacesCombobox
      placeholder="Search an address"
      initialValue=""
      name="google-places-search"
      setCentre={setCentre}
      handleClose={handleClose}
    />
  )
}

export const MemberPlaces = ({
  setCentre,
  memberSearch,
  placesSearchByLocation,
  placesSearchByName,
  handleClose,
}: MemberPlacesProps) => {
  return (
    <MemberPlacesCombobox
      placeholder="Search for a Member/Fellowship/Outreach Venues"
      name="member-places-search"
      initialValue=""
      setCentre={setCentre}
      memberSearch={memberSearch}
      placesSearchByName={placesSearchByName}
      handleClose={handleClose}
    />
  )
}
