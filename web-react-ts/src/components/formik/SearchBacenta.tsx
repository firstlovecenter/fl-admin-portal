import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { DEBOUNCE_TIMER, isAuthorised, throwToSentry } from 'global-utils'
import { permitMe } from 'permission-utils'
import { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formik-types'
import { useSearchInitialValue } from './search-utils'
import {
  COUNCIL_BACENTA_SEARCH,
  CAMPUS_BACENTA_SEARCH,
  STREAM_BACENTA_SEARCH,
  GOVERNORSHIP_BACENTA_SEARCH,
  MEMBER_BACENTA_SEARCH,
} from './SearchBacentaQueries'
import SearchCombobox from './SearchCombobox'

type Suggestion = { id: string; name: string }

const SearchBacenta = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searchString, setSearchString] = useSearchInitialValue(
    props.initialValue
  )

  const [campusSearch, { error: campusError }] = useLazyQuery(
    CAMPUS_BACENTA_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.campuses[0].bacentaSearch),
    }
  )
  const [streamSearch, { error: streamError }] = useLazyQuery(
    STREAM_BACENTA_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.streams[0].bacentaSearch),
    }
  )
  const [councilSearch, { error: councilError }] = useLazyQuery(
    COUNCIL_BACENTA_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.councils[0].bacentaSearch),
    }
  )
  const [governorshipSearch, { error: governorshipError }] = useLazyQuery(
    GOVERNORSHIP_BACENTA_SEARCH,
    {
      onCompleted: (data) =>
        setSuggestions(data.governorships[0].bacentaSearch),
    }
  )
  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_BACENTA_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.members[0].bacentaSearch),
    }
  )

  const error =
    memberError ||
    campusError ||
    streamError ||
    councilError ||
    governorshipError
  useEffect(() => {
    if (error) throwToSentry('', error)
  }, [error])

  const whichSearch = (key: string) => {
    memberSearch({
      variables: { id: currentUser.id, key },
    })
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

export default SearchBacenta
