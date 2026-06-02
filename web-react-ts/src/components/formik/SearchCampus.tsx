import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { DEBOUNCE_TIMER, isAuthorised, throwToSentry } from 'global-utils'
import { permitMe } from 'permission-utils'
import { useContext, useEffect, useState } from 'react'
import { useSearchInitialValue } from './search-utils'
import { MEMBER_CAMPUS_SEARCH } from './SearchCampusQueries'
import { RoleBasedSearch } from './formik-types'
import { CAMPUS_COUNCIL_SEARCH } from './SearchCouncilQueries'
import SearchCombobox from './SearchCombobox'

type Suggestion = { id: string; name: string }

const SearchCampus = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searchString, setSearchString] = useSearchInitialValue(
    props.initialValue
  )

  const [campusSearch, { error: campusError }] = useLazyQuery(
    CAMPUS_COUNCIL_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.campuss[0].councilSearch),
    }
  )
  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_CAMPUS_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.members[0].campusSearch),
    }
  )

  const error = memberError || campusError
  useEffect(() => {
    if (error) throwToSentry('', error)
  }, [error])

  const whichSearch = (key: string) => {
    memberSearch({ variables: { id: currentUser.id, key } })
    if (props.roleBased && isAuthorised(permitMe('Campus'), currentUser.roles)) {
      campusSearch({ variables: { id: currentUser.campus, key } })
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

export default SearchCampus
