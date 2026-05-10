import { useContext, useEffect, useState } from 'react'
import { FormikComponentProps } from 'components/formik/formik-types'
import SearchCombobox from 'components/formik/SearchCombobox'
import { useSearchInitialValue } from 'components/formik/search-utils'
import { LazyQueryExecFunction, OperationVariables } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { DEBOUNCE_TIMER } from 'global-utils'
import { PlaceType } from '../types'

interface ComboBoxProps extends FormikComponentProps {
  initialValue: string
  setCentre: (position: PlaceType) => void
  placesSearchByName: LazyQueryExecFunction<any, OperationVariables>
  handleClose: () => void
}

type PlaceSuggestion = {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  typename: PlaceType['typename']
  description?: string
  picture?: string
  latitude: string
  longitude: string
}

const getName = (place: PlaceSuggestion) => {
  if (place.name) {
    return `${place.typename}: ${place.name}`
  }
  if (place.firstName) {
    return `${place.typename}: ${place.firstName} ${place.lastName ?? ''}`.trim()
  }
  return ''
}

const MemberPlacesCombobox = (props: ComboBoxProps) => {
  const {
    label,
    name,
    placeholder,
    initialValue,
    handleClose,
    placesSearchByName,
  } = props
  const { currentUser } = useContext(MemberContext)

  const [searchString, setSearchString] = useSearchInitialValue(initialValue)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])

  useEffect(() => {
    const timerId = setTimeout(async () => {
      const results = await placesSearchByName({
        variables: {
          id: currentUser.id,
          key: searchString.trim(),
        },
      })

      setSuggestions(results.data?.members?.[0]?.placesSearchByName ?? [])
    }, DEBOUNCE_TIMER)

    return () => clearTimeout(timerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchString])

  return (
    <SearchCombobox<PlaceSuggestion>
      label={label}
      name={name}
      id={name}
      placeholder={placeholder}
      value={searchString}
      onValueChange={setSearchString}
      suggestions={suggestions}
      getItemKey={(s) => s.id}
      getItemValue={getName}
      onSelect={(suggestion) => {
        const location: google.maps.LatLngLiteral = {
          lat: parseFloat(suggestion.latitude),
          lng: parseFloat(suggestion.longitude),
        }
        props.setCentre({
          id: suggestion.id,
          name: suggestion.name ?? '',
          typename: suggestion.typename,
          description: suggestion.description,
          picture: suggestion.picture,
          position: location,
        })
        handleClose()
        setSearchString(getName(suggestion))
      }}
    />
  )
}

export default MemberPlacesCombobox
