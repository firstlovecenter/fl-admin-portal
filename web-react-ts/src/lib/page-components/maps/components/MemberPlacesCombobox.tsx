import { useContext, useEffect, useState } from 'react'
import Autosuggest from 'react-autosuggest'
import { FormikComponentProps } from '@/components/formik/formik-types'
import 'components/formik/Formik.css'
import 'components/formik/react-autosuggest.css'
import { LazyQueryExecFunction, OperationVariables } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { DEBOUNCE_TIMER } from 'global-utils'
import { PlaceType } from './MapComponent'

interface ComboBoxProps extends FormikComponentProps {
  initialValue: string
  setCentre: (position: PlaceType) => void
  memberSearch: LazyQueryExecFunction<any, OperationVariables>
  placesSearchByName: LazyQueryExecFunction<any, OperationVariables>
  handleClose: () => void
}

const getName = (place: any) => {
  if (place.name) {
    return place.typename + ': ' + place.name
  }
  if (place.firstName) {
    return place.typename + ': ' + place.firstName + ' ' + place.lastName
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

  const [searchString, setSearchString] = useState(initialValue ?? '')
  const [suggestions, setSuggestions] = useState<any[]>([])

  // TODO: Suggestions are generated after the first keystroke.  This is not ideal.
  // They should be generated before the first keystroke.

  const searchFunctions = async () => {
    const placesResults = await placesSearchByName({
      variables: {
        id: currentUser.id,
        key: searchString.trim(),
      },
    })

    if (placesResults.data.members[0].placesSearchByName.length === 0) {
      return
    }

    setSuggestions(placesResults.data.members[0].placesSearchByName)
  }

  useEffect(() => {
    const timerId = setTimeout(() => {
      searchFunctions()
    }, DEBOUNCE_TIMER)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchString])

  return (
    <div>
      {label ? (
        <label className="label" htmlFor={name}>
          {label}
        </label>
      ) : null}
      <Autosuggest
        inputProps={{
          placeholder,
          id: name,
          autoComplete: 'off',
          value: searchString,
          name,
          className: 'form-control',
          onChange: (_event: any, { newValue }: any) => {
            setSearchString(newValue)
          },
        }}
        suggestions={suggestions}
        onSuggestionsFetchRequested={async ({ value }: any) => {
          try {
          } catch {
            setSuggestions([])
          }
        }}
        onSuggestionsClearRequested={() => {
          setSuggestions([])
        }}
        onSuggestionSelected={(event, { suggestion, method }: any) => {
          if (method === 'enter') {
            event.preventDefault()
          }

          const location: google.maps.LatLngLiteral = {
            lat: parseFloat(suggestion.latitude),
            lng: parseFloat(suggestion.longitude),
          }

          props.setCentre({
            id: suggestion.id,
            name: suggestion.name,
            typename: suggestion.typename,
            description: suggestion.description,
            picture: suggestion.picture,
            position: location,
          })
          handleClose()

          setSearchString(getName(suggestion))
        }}
        getSuggestionValue={(suggestion: any) => {
          if (suggestion?.name) {
            return `${suggestion.typename}: ${suggestion.name}`
          }

          if (suggestion?.firstName) {
            return `${suggestion.typename}: ${suggestion.firstName} ${suggestion.lastName}`
          }

          return ''
        }}
        highlightFirstSuggestion
        renderSuggestion={(suggestion: any) => {
          return <div className="combobox-control">{getName(suggestion)}</div>
        }}
      />
    </div>
  )
}

export default MemberPlacesCombobox
