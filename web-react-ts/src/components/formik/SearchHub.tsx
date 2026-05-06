import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { DEBOUNCE_TIMER, throwToSentry } from 'global-utils'
import { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formik-types'
import { useSearchInitialValue } from './search-utils'
import { MEMBER_HUB_SEARCH } from './SearchHubQueries'
import SearchCombobox from './SearchCombobox'

type Suggestion = { id: string; name: string }

const SearchHub = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searchString, setSearchString] = useSearchInitialValue(
    props.initialValue
  )

  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_HUB_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.members[0].hubSearch),
    }
  )

  useEffect(() => {
    if (memberError) throwToSentry('', memberError)
  }, [memberError])

  useEffect(() => {
    const timerId = setTimeout(() => {
      memberSearch({
        variables: { id: currentUser.id, key: searchString?.trim() },
      })
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

export default SearchHub
