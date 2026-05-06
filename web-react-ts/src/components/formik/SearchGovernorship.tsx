import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { DEBOUNCE_TIMER, isAuthorised, throwToSentry } from 'global-utils'
import { permitMe } from 'permission-utils'
import { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formik-types'
import { useSearchInitialValue } from './search-utils'
import {
  CAMPUS_GOVERNORSHIP_SEARCH,
  STREAM_GOVERNORSHIP_SEARCH,
  MEMBER_GOVERNORSHIP_SEARCH,
  COUNCIL_GOVERNORSHIP_SEARCH,
} from './SearchGovernorshipQueries'
import SearchCombobox from './SearchCombobox'

type Suggestion = { id: string; name: string }

const SearchGovernorship = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searchString, setSearchString] = useSearchInitialValue(
    props.initialValue
  )

  const [campusSearch, { error: campusError }] = useLazyQuery(
    CAMPUS_GOVERNORSHIP_SEARCH,
    {
      onCompleted: (data) =>
        setSuggestions(data.campuses[0].governorshipSearch),
    }
  )
  const [streamSearch, { error: streamError }] = useLazyQuery(
    STREAM_GOVERNORSHIP_SEARCH,
    {
      onCompleted: (data) =>
        setSuggestions(data.streams[0].governorshipSearch),
    }
  )
  const [councilSearch, { error: councilError }] = useLazyQuery(
    COUNCIL_GOVERNORSHIP_SEARCH,
    {
      onCompleted: (data) =>
        setSuggestions(data.councils[0].governorshipSearch),
    }
  )
  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_GOVERNORSHIP_SEARCH,
    {
      onCompleted: (data) =>
        setSuggestions(data.members[0].governorshipSearch),
    }
  )

  const error = memberError || campusError || streamError || councilError
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

export default SearchGovernorship
