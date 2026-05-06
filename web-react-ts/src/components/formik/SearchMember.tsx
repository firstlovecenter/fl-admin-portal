import { useLazyQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import {
  DEBOUNCE_TIMER,
  getFirstLetterInEveryWord,
  throwToSentry,
} from 'global-utils'
import { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formik-types'
import {
  BASONTA_MEMBER_SEARCH,
  BASONTA_MEMBER_SEARCH_FROM_HUB,
  MEMBER_MEMBER_SEARCH,
} from './SearchMemberQueries'
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
  const { hubId } = useContext(ChurchContext)
  const [suggestions, setSuggestions] = useState<Member[]>([])
  const [searchString, setSearchString] = useSearchInitialValue(
    props.initialValue
  )

  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_MEMBER_SEARCH,
    {
      onCompleted: (data) => setSuggestions(data.members[0].memberSearch),
    }
  )
  const [basontaMemberSearchFromHub, { error: hubMemberError }] = useLazyQuery(
    BASONTA_MEMBER_SEARCH_FROM_HUB,
    {
      onCompleted: (data) =>
        setSuggestions(data.members[0].basontaMemberSearchFromHub),
    }
  )
  const [basontaMemberSearch, { error: basontaMemberError }] = useLazyQuery(
    BASONTA_MEMBER_SEARCH,
    {
      onCompleted: (data) =>
        setSuggestions(data.members[0].basontaMemberSearch),
    }
  )

  const error = memberError || hubMemberError || basontaMemberError
  useEffect(() => {
    if (error) throwToSentry('', error)
  }, [error])

  const whichSearch = (key: string) => {
    if (props.creativeArts && hubId) {
      basontaMemberSearchFromHub({
        variables: { id: currentUser.id, key, hubId },
      })
    } else if (props.creativeArts && !hubId) {
      basontaMemberSearch({ variables: { id: currentUser.id, key } })
    } else {
      memberSearch({ variables: { id: currentUser.id, key } })
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
        props.setFieldValue(props.name, member.id)
        props.setFieldValue('leaderEmail', member.email)
      }}
      error={props.error}
    />
  )
}

export default SearchMember
