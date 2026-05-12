import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import {
  DEBOUNCE_TIMER,
  getFirstLetterInEveryWord,
  throwToSentry,
} from 'global-utils'
import { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formik-types'
import { MEMBER_MEMBER_SEARCH } from './SearchMemberQueries'
import { useSearchInitialValue } from './search-utils'
import SearchCombobox from './SearchCombobox'

type Member = {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  email?: string
}

const formatName = (m: Member) => `${m.firstName} ${m.lastName}`

const SearchMember = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState<Member[]>([])
  const [searchString, setSearchString] = useSearchInitialValue(
    props.initialValue
  )

  const [memberSearch, { error }] = useLazyQuery(MEMBER_MEMBER_SEARCH, {
    onCompleted: (data) => setSuggestions(data.members[0].memberSearch),
  })

  useEffect(() => {
    if (error) throwToSentry('', error)
  }, [error])

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
    <SearchCombobox<Member>
      label={props.label}
      name={props.name}
      id={props.name}
      placeholder={props.placeholder}
      value={searchString}
      onValueChange={setSearchString}
      suggestions={suggestions}
      getItemKey={(m) => m.id}
      getItemValue={formatName}
      renderItem={(m) => (
        <span className="truncate">
          {m.firstName}{' '}
          {m.middleName ? getFirstLetterInEveryWord(m.middleName) : ''}{' '}
          {m.lastName}
        </span>
      )}
      onSelect={(member) => {
        setSearchString(formatName(member))
        // Set the side-effect email first without validating — Formik's
        // setFieldValue validates against a stale state.values closure, so
        // a follow-up validating call on the primary field would re-fire
        // validation with leaderEmail filled but the primary field empty.
        props.setFieldValue('leaderEmail', member.email, false)
        props.setFieldValue(props.name, member.id)
      }}
      error={props.error}
    />
  )
}

export default SearchMember
