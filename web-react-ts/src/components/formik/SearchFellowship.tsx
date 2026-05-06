import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { DEBOUNCE_TIMER, isAuthorised, throwToSentry } from 'global-utils'
import { permitMe } from 'permission-utils'
import { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formik-types'
import { useSearchInitialValue } from './search-utils'
import {
  COUNCIL_FELLOWSHIP_SEARCH,
  CAMPUS_FELLOWSHIP_SEARCH,
  STREAM_FELLOWSHIP_SEARCH,
  GOVERNORSHIP_FELLOWSHIP_SEARCH,
  BACENTA_FELLOWSHIP_SEARCH,
  MEMBER_FELLOWSHIP_SEARCH,
} from './SearchFellowshipQueries'
import SearchCombobox from './SearchCombobox'

type Suggestion = { id: string; name: string }

const SearchFellowship = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searchString, setSearchString] = useSearchInitialValue(
    props.initialValue
  )

  const [campusSearch, { error: campusError }] = useLazyQuery(
    CAMPUS_FELLOWSHIP_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.campuses[0].fellowshipSearch),
    }
  )
  const [streamSearch, { error: streamError }] = useLazyQuery(
    STREAM_FELLOWSHIP_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.streams[0].fellowshipSearch),
    }
  )
  const [councilSearch, { error: councilError }] = useLazyQuery(
    COUNCIL_FELLOWSHIP_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.councils[0].fellowshipSearch),
    }
  )
  const [governorshipSearch, { error: governorshipError }] = useLazyQuery(
    GOVERNORSHIP_FELLOWSHIP_SEARCH,
    {
      onCompleted: (data) =>
        setSuggestions(data.governorships[0].fellowshipSearch),
    }
  )
  const [bacentaSearch, { error: bacentaError }] = useLazyQuery(
    BACENTA_FELLOWSHIP_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.bacentas[0].fellowshipSearch),
    }
  )
  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_FELLOWSHIP_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.members[0].fellowshipSearch),
    }
  )

  const error =
    campusError ||
    streamError ||
    councilError ||
    governorshipError ||
    bacentaError ||
    memberError
  useEffect(() => {
    if (error) throwToSentry('', error)
  }, [error])

  const whichSearch = (key: string) => {
    memberSearch({ variables: { id: currentUser.id, key } })
    if (props.roleBased) {
      if (isAuthorised(permitMe('Campus'), currentUser.roles)) {
        campusSearch({ variables: { id: currentUser.campus, key } })
      } else if (isAuthorised(permitMe('Stream'), currentUser.roles)) {
        streamSearch({ variables: { id: currentUser.stream, key } })
      } else if (isAuthorised(permitMe('Council'), currentUser.roles)) {
        councilSearch({ variables: { id: currentUser.council, key } })
      } else if (isAuthorised(permitMe('Governorship'), currentUser.roles)) {
        governorshipSearch({
          variables: { id: currentUser.governorship, key },
        })
      } else if (isAuthorised(permitMe('Bacenta'), currentUser.roles)) {
        bacentaSearch({ variables: { id: currentUser.bacenta, key } })
      }
    }
  }

  useEffect(() => {
    const timerId = setTimeout(() => {
      whichSearch(searchString?.trim())
    }, DEBOUNCE_TIMER)
    return () => clearTimeout(timerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchString])

  return (
    <SearchCombobox<Suggestion>
      label={props.label}
      name={props.name}
      id={props.name}
      placeholder={props.placeholder}
      value={searchString}
      onValueChange={setSearchString}
      suggestions={suggestions}
      getItemKey={(s) => s.id}
      getItemValue={(s) => s.name}
      onSelect={(suggestion) => {
        setSearchString(suggestion.name)
        props.setFieldValue(props.name, suggestion)
      }}
      error={props.error}
    />
  )
}

export default SearchFellowship
