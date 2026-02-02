'use client'

import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { ErrorMessage } from 'formik'
import {
  DEBOUNCE_TIMER,
  getFirstLetterInEveryWord,
  throwToSentry,
} from 'global-utils'
import { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formik-types'
import Autosuggest from 'react-autosuggest'
import './react-autosuggest.css'
import {
  BASONTA_MEMBER_SEARCH,
  BASONTA_MEMBER_SEARCH_FROM_HUB,
  MEMBER_MEMBER_SEARCH,
} from './SearchMemberQueries'
import TextError from './TextError/TextError'
import { ChurchContext } from 'contexts/ChurchContext'

const SearchMember = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const { hubId } = useContext(ChurchContext)
  const [suggestions, setSuggestions] = useState([])
  const [searchString, setSearchString] = useState(props.initialValue ?? '')
  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.members[0].memberSearch)
        return
      },
    }
  )
  const [basontaMemberSearchFromHub, { error: hubMemberError }] = useLazyQuery(
    BASONTA_MEMBER_SEARCH_FROM_HUB,
    {
      onCompleted: (data) => {
        setSuggestions(data.members[0].basontaMemberSearchFromHub)
        return
      },
    }
  )
  const [basontaMemberSearch, { error: basontaMemberError }] = useLazyQuery(
    BASONTA_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.members[0].basontaMemberSearch)
        return
      },
    }
  )

  const error = memberError || hubMemberError || basontaMemberError
  throwToSentry('', error)

  const whichSearch = (searchString: string) => {
    if (props.creativeArts && hubId) {
      basontaMemberSearchFromHub({
        variables: { id: currentUser.id, key: searchString?.trim(), hubId },
      })
    } else if (props.creativeArts && !hubId) {
      basontaMemberSearch({
        variables: { id: currentUser.id, key: searchString?.trim() },
      })
    } else {
      memberSearch({
        variables: {
          id: currentUser.id,
          key: searchString?.trim(),
        },
      })
    }
  }

  useEffect(() => {
    const timerId = setTimeout(() => {
      whichSearch(searchString)
    }, DEBOUNCE_TIMER)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchString])

  return (
    <div>
      {props.label ? <label className="label">{props.label}</label> : null}
      {/*// @ts-ignore*/}
      <Autosuggest
        inputProps={{
          placeholder: props.placeholder,
          id: name,
          autoComplete: 'off',
          value: searchString,
          name: name,
          className: 'form-control',
          onChange: (_event, { newValue }) => {
            setSearchString(newValue)
          },
        }}
        suggestions={suggestions}
        onSuggestionsFetchRequested={async ({ value }) => {
          if (!value) {
            setSuggestions([])
          }
        }}
        onSuggestionsClearRequested={() => {
          setSuggestions([])
        }}
        onSuggestionSelected={(event, { suggestion, method }) => {
          if (method === 'enter') {
            event.preventDefault()
          }
          setSearchString(suggestion.firstName + ' ' + suggestion.lastName)

          props.setFieldValue(`${props.name}`, suggestion.id)
          props.setFieldValue('leaderEmail', suggestion?.email)
        }}
        getSuggestionValue={(suggestion) =>
          suggestion.firstName + ' ' + suggestion.lastName
        }
        highlightFirstSuggestion={true}
        renderSuggestion={(suggestion: any) => (
          <div className="combobox-control">
            {suggestion?.firstName +
              ' ' +
              getFirstLetterInEveryWord(suggestion?.middleName) +
              ' ' +
              suggestion?.lastName}
          </div>
        )}
      />

      {props.error && <TextError>{props.error}</TextError>}
      {/*// @ts-ignore*/}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </div>
  )
}

export default SearchMember
