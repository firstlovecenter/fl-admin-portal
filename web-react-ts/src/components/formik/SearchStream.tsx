import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { ErrorMessage } from 'formik'
import { DEBOUNCE_TIMER, isAuthorised, throwToSentry } from 'global-utils'
import { permitMe } from 'permission-utils'
import React, { useContext, useEffect, useState } from 'react'
import Autosuggest from 'react-autosuggest'
import { initialise } from './search-utils'
import {
  CAMPUS_STREAM_SEARCH,
  MEMBER_STREAM_SEARCH,
} from './SearchStreamQueries'

import { RoleBasedSearch } from './formik-types'

import TextError from './TextError/TextError'
import { STREAM_COUNCIL_SEARCH } from './SearchCouncilQueries'

const SearchStream = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState([])
  const [searchString, setSearchString] = useState(props.initialValue ?? '')

  const [campusSearch, { error: campusError }] = useLazyQuery(
    CAMPUS_STREAM_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.campuses[0].streamSearch)
      },
    }
  )
  const [streamSearch, { error: streamError }] = useLazyQuery(
    STREAM_COUNCIL_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.streams[0].councilSearch)
      },
    }
  )
  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_STREAM_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.members[0].streamSearch)
      },
    }
  )

  const error = memberError || campusError || streamError
  throwToSentry('', error)

  const whichSearch = (searchString: string) => {
    memberSearch({
      variables: {
        id: currentUser.id,
        key: searchString?.trim(),
      },
    })
    if (props.roleBased) {
      if (isAuthorised(permitMe('Campus'), currentUser.roles)) {
        campusSearch({
          variables: {
            id: currentUser.campus,
            key: searchString?.trim(),
          },
        })
      } else if (isAuthorised(permitMe('Stream'), currentUser.roles)) {
        streamSearch({
          variables: {
            id: currentUser.stream,
            key: searchString?.trim(),
          },
        })
      }
    }
  }

  useEffect(() => {
    setSearchString(initialise(searchString, props.initialValue))
  }, [props.initialValue])

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
          name,
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
          setSearchString(suggestion.name)
          props.setFieldValue(`${props.name}`, suggestion)
        }}
        getSuggestionValue={(suggestion) => suggestion.name}
        highlightFirstSuggestion
        renderSuggestion={(suggestion: any) => (
          <div className="combobox-control">{suggestion.name}</div>
        )}
      />

      {props.error && <TextError>{props.error}</TextError>}
      {/*// @ts-ignore*/}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </div>
  )
}

export default SearchStream
