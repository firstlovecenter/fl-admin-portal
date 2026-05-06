import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { DEBOUNCE_TIMER, isAuthorised, throwToSentry } from 'global-utils'
import { permitMe } from 'permission-utils'
import { useContext, useEffect, useState } from 'react'
import { useSearchInitialValue } from './search-utils'
import {
  CAMPUS_STREAM_SEARCH,
  MEMBER_STREAM_SEARCH,
} from './SearchStreamQueries'
import { RoleBasedSearch } from './formik-types'
import { STREAM_COUNCIL_SEARCH } from './SearchCouncilQueries'
import SearchCombobox from './SearchCombobox'

type Suggestion = { id: string; name: string }

const SearchStream = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searchString, setSearchString] = useSearchInitialValue(
    props.initialValue
  )

  const [campusSearch, { error: campusError }] = useLazyQuery(
    CAMPUS_STREAM_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.campuses[0].streamSearch),
    }
  )
  const [streamSearch, { error: streamError }] = useLazyQuery(
    STREAM_COUNCIL_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.streams[0].councilSearch),
    }
  )
  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_STREAM_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.members[0].streamSearch),
    }
  )

  const error = memberError || campusError || streamError
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

export default SearchStream
