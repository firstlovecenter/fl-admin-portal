import { useState } from 'react'
import { FormikComponentProps } from 'components/formik/formik-types'
import SearchCombobox from 'components/formik/SearchCombobox'
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete'
import { PlaceType } from '../types'

interface ComboBoxProps extends FormikComponentProps {
  initialValue: string
  setCentre: (position: PlaceType) => void
  handleClose: () => void
}

type Place = { description: string; place_id: string; name: string }

const GooglePlacesCombobox = (props: ComboBoxProps) => {
  const { label, name, placeholder, initialValue, handleClose, setCentre } =
    props

  const {
    ready,
    setValue,
    suggestions: { data },
    clearSuggestions,
  } = usePlacesAutocomplete()

  const [searchString, setSearchString] = useState(initialValue ?? '')

  const places: Place[] = data
    .slice(0, 7)
    .map((s) => ({
      description: s.description,
      place_id: s.place_id,
      name: s.description,
    }))

  const handleSelect = async (val: Place) => {
    setValue(val.description, false)
    clearSuggestions()

    const results = await getGeocode({ address: val.description })
    const { lat, lng } = getLatLng(results[0])
    setCentre({
      id: '',
      name: val.name,
      typename: 'GooglePlace',
      position: { lat, lng },
    })
  }

  return (
    <SearchCombobox<Place>
      label={label}
      name={name}
      id={name}
      placeholder={placeholder}
      value={searchString}
      onValueChange={(value) => {
        if (!ready) clearSuggestions()
        setSearchString(value)
        setValue(value)
      }}
      suggestions={places}
      getItemKey={(p) => p.place_id}
      getItemValue={(p) => p.name}
      onSelect={(suggestion) => {
        setSearchString(suggestion.description)
        handleSelect(suggestion)
        handleClose()
      }}
    />
  )
}

export default GooglePlacesCombobox
